"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { load } from "cheerio"
import { is_metadata_fresh, parseArguments, selectItems, showHelp, wait } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadataDirectory = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadataDirectory, "metadata.json")
const journalConfigFile = path.resolve(scriptDirectory, "../data/statistics_journals.json")
const crossrefWorksUrl = "https://api.crossref.org/works"

try {
	const options = parseArguments(process.argv.slice(2))
	if (options.help) {
		showHelp()
	} else {
		const items = read_json(metadataFile)
		const config = read_json(journalConfigFile)
		if (!Array.isArray(items)) throw new Error(`${metadataFile} must contain a JSON array`)
		if (!Array.isArray(config.journals)) throw new Error(`${journalConfigFile} must contain a journals array`)

		const selectedItems = [...new Map(selectItems(items, options)
			.filter((item) => item?.name)
			.map((item) => [item.name, item])).values()]
		const software = selectedItems
			.map((item) => ({ item, matchName: normalize_text(item.name) }))
			.filter(({ matchName }) => matchName.length >= 3)
		const unsearchableNames = selectedItems.filter((item) => normalize_text(item.name).length < 3)
		const mentionCounts = new Map(software.map(({ item }) => [item.name, new Map()]))
		const mentionArticles = new Map(software.map(({ item }) => [item.name, []]))
		const coverage = { searched: [], unavailable: [] }
		const staleNames = new Set(
			selectedItems
				.filter((item) => options.force || !is_metadata_fresh(path.join(metadataDirectory, item.name, "mentions.json")))
				.map((item) => item.name)
		)

		if (staleNames.size === 0) {
			console.log("Mentions cached for all selected items; skipping journal search")
		}

		for (const journal of staleNames.size === 0 ? [] : config.journals) {
			const search = journal.mentionSearch
			if (!search || search.supported === false || search.provider !== "crossref" || !search.issn) {
				coverage.unavailable.push({ id: journal.id, title: journal.title, reason: search?.reason || "No Crossref ISSN configured" })
				continue
			}

			try {
				const works = await fetch_journal_works(search.issn)
				coverage.searched.push({ id: journal.id, title: journal.title, issn: search.issn, articleCount: works.length })
				console.log(`${journal.title}: retrieved ${works.length} Crossref records`)
				for (const work of works) {
					const text = normalize_text([
						...(Array.isArray(work.title) ? work.title : []),
						work.abstract ? strip_markup(work.abstract) : ""
					].join(" "))
					if (!text) continue
					const title = strip_markup((Array.isArray(work.title) ? work.title[0] : "") || "").replace(/\s+/g, " ").trim() || "Untitled"
					const publicationYear = get_publication_year(work)
					for (const { item, matchName } of software) {
						if (contains_phrase(text, matchName)) {
							const counts = mentionCounts.get(item.name)
							counts.set(journal.id, (counts.get(journal.id) || 0) + 1)
							mentionArticles.get(item.name).push({
								journalId: journal.id,
							journalTitle: journal.title,
							articleTitle: title,
							authors: format_authors(work.author),
							publicationYear,
							doi: work.DOI || null
							})
						}
					}
				}
			} catch (error) {
				coverage.unavailable.push({ id: journal.id, title: journal.title, reason: error.message })
			}
			await wait(1000)
		}

		for (const [index, item] of selectedItems.entries()) {
			const metricsFile = path.join(metadataDirectory, item.name, "metrics.json")
			const mentionsFile = path.join(metadataDirectory, item.name, "mentions.json")
			if (!staleNames.has(item.name)) {
				console.log(`[${index + 1}/${selectedItems.length}] ${item.name} (from cache)`)
				continue
			}
			const metrics = read_json_if_exists(metricsFile) || {}
			const normalizedName = normalize_text(item.name)
			const mentionsFound = mentionArticles.get(item.name) || []
			let mentionResults
			if (normalizedName.length < 3) {
				mentionResults = {
					mentions: null,
					mentionsByJournal: {},
					unavailableReason: "Package name is too short for reliable title/abstract matching"
				}
			} else if (coverage.searched.length === 0) {
				mentionResults = {
					mentions: null,
					mentionsByJournal: {},
					unavailableReason: "No journal corpus was successfully searched"
				}
			} else {
				const counts = mentionCounts.get(item.name) || new Map()
				const mentionsByJournal = {}
				let totalMentions = 0
				for (const journal of coverage.searched) {
					const count = counts.get(journal.id) || 0
					totalMentions += count
					if (count > 0) mentionsByJournal[journal.id] = { count }
				}
				mentionResults = {
					mentions: totalMentions,
					mentionsByJournal
				}
			}

			const fullMentions = {
				package: item.name,
				...mentionResults,
				mentionsFound,
				method: "Crossref indexed article titles and abstracts; exact normalized package-name phrase; each matching journal article counted equally",
				coverage,
				discoverySources: (config.discoverySources || []).map((source) => ({
					id: source.id,
					title: source.title,
					searchUrl: `${source.searchUrl}?q=${encodeURIComponent(`\"${item.name}\"`)}`,
					automatedCountsSupported: source.automatedCountsSupported,
					reason: source.reason
				})),
				searchedAt: new Date().toISOString()
			}
			fullMentions.generatedAt = new Date().toISOString()
			for (const key of ["mentions", "mentionsByJournal"]) {
				metrics[key] = mentionResults[key]
			}
			metrics.mentionsFound = mentionsFound
			for (const key of ["mentionsRaw", "mentionsMethod", "mentionsWeights", "mentionsCoverage", "mentionsUnavailableReason"]) {
				delete metrics[key]
			}
			fs.mkdirSync(path.dirname(metricsFile), { recursive: true })
			fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2), "utf8")
			fs.writeFileSync(mentionsFile, JSON.stringify(fullMentions, null, 2), "utf8")
			console.log(`[${index + 1}/${selectedItems.length}] ${item.name}: ${metrics.mentions} mentions`)
		}

		for (const item of unsearchableNames) {
			console.warn(`${item.name}: mention matching skipped because the name is too short`)
		}
		console.log(`Updated mention metrics for ${selectedItems.length} item(s); searched ${coverage.searched.length} journal(s), ${coverage.unavailable.length} unavailable.`)
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

async function fetch_journal_works(issn) {
	const works = []
	const seenDois = new Set()
	let cursor = "*"
	while (cursor) {
		const url = new URL(crossrefWorksUrl)
		url.searchParams.set("filter", `issn:${issn}`)
		url.searchParams.set("select", "DOI,title,author,abstract,published,issued,published-print,published-online")
		url.searchParams.set("rows", "1000")
		url.searchParams.set("cursor", cursor)
		const response = await fetch(url, {
			headers: { "User-Agent": "awesome-official-statistics-software/1.0 (https://github.com/SNStatComp/awesome-official-statistics-software)" },
			signal: AbortSignal.timeout(30000)
		})
		if (!response.ok) throw new Error(`Crossref returned HTTP ${response.status}`)
		const result = await response.json()
		const message = result?.message
		if (!Array.isArray(message?.items)) throw new Error("Crossref returned an invalid works response")
		for (const work of message.items) {
			if (work.DOI && seenDois.has(work.DOI)) continue
			if (work.DOI) seenDois.add(work.DOI)
			works.push(work)
		}
		const nextCursor = message["next-cursor"]
		if (!message.items.length || !nextCursor || nextCursor === cursor) break
		cursor = nextCursor
		await wait(1000)
	}
	return works
}

function normalize_text(value) {
	return value
		.normalize("NFKC")
		.toLocaleLowerCase("en")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim()
}

function format_authors(authors) {
	if (!Array.isArray(authors)) return []
	return authors
		.map((author) => [author.given, author.family].filter(Boolean).join(" ").trim())
		.filter(Boolean)
}

function contains_phrase(text, phrase) {
	return ` ${text} `.includes(` ${phrase} `)
}

function strip_markup(value) {
	return load(value, { xmlMode: true }).text()
}

function get_publication_year(work) {
	const publicationDates = [work.published, work["published-print"], work["published-online"], work.issued]
	for (const date of publicationDates) {
		const year = date?.["date-parts"]?.[0]?.[0]
		if (Number.isInteger(year)) return year
	}
	return "year unknown"
}

function read_json(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function read_json_if_exists(filePath) {
	try {
		return read_json(filePath)
	} catch (error) {
		if (error.code !== "ENOENT") console.warn(`Unable to read ${filePath}: ${error.message}`)
		return undefined
	}
}
