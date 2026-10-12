"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { load } from "cheerio"
import { PDFParse } from "pdf-parse"
import { is_metadata_fresh, itemType, parseArguments, selectItems, showHelp, wait } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadataDirectory = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadataDirectory, "metadata.json")

try {
	const options = parseArguments(process.argv.slice(2))
	if (options.help) {
		showHelp()
	} else {
		const items = JSON.parse(fs.readFileSync(metadataFile, "utf8"))
		if (!Array.isArray(items)) throw new Error(`${metadataFile} must contain a JSON array`)
		const selectedItems = [...new Map(selectItems(items, { ...options, type: options.type || "CRAN" })
			.filter((item) => item?.name && itemType(item.url) === "CRAN")
			.map((item) => [item.name, item])).values()]
		console.log(`Total CRAN items to process: ${selectedItems.length}`)
		await process_items(selectedItems, options)
	}
	} catch (error) {
	console.error(error)
	process.exitCode = 1
}

async function process_items(items, options) {
	for (const [index, item] of items.entries()) {
		const itemDirectory = path.join(metadataDirectory, item.name)
		const packageFile = path.join(itemDirectory, "pkg_cran.json")
		if (!fs.existsSync(packageFile)) continue
		if (!options.force && is_metadata_fresh(packageFile)) {
			console.log(`[${index + 1}/${items.length}] ${item.name}: (from cache)`)
			continue
		}

		try {
			const packageMetadata = JSON.parse(fs.readFileSync(packageFile, "utf8"))
			const packageName = packageMetadata.Package || item.name
			const packagePage = `https://cran.r-project.org/package=${encodeURIComponent(packageName)}`
			const pageResponse = await fetch(packagePage, request_options())
			if (!pageResponse.ok) throw new Error(`HTTP ${pageResponse.status} ${pageResponse.statusText}`)

			const $ = load(await pageResponse.text())
			const vignettes = new Map()
			$("a[href]").each((_, anchor) => {
				try {
					const url = new URL($(anchor).attr("href"), pageResponse.url)
					if (url.hostname !== "cran.r-project.org" || !/^\/web\/packages\/[^/]+\/vignettes\/.*\.(html|pdf)$/i.test(url.pathname)) return
					url.hash = ""
					const title = $(anchor).text().replace(/\s+/g, " ").trim() || path.basename(url.pathname, path.extname(url.pathname))
					vignettes.set(url.href, { title, url: url.href })
				} catch {
					return
				}
			})

			const vignetteDetails = []
			for (const vignette of vignettes.values()) {
				try {
					const wordCount = path.extname(new URL(vignette.url).pathname).toLowerCase() === ".pdf"
						? await count_pdf_words(vignette.url)
						: await count_html_words(vignette.url)
					vignetteDetails.push({ ...vignette, wordCount })
				} catch (error) {
					console.warn(`Unable to count words in ${vignette.url}: ${error.message}`)
					vignetteDetails.push({ ...vignette, wordCount: null })
				}
				await wait(250)
			}

			packageMetadata.VignetteCount = vignetteDetails.length
			packageMetadata.Vignettes = vignetteDetails
			packageMetadata.VignettesCheckedAt = new Date().toISOString()
			packageMetadata.generatedAt = new Date().toISOString()
			fs.writeFileSync(packageFile, JSON.stringify(packageMetadata), "utf8")
			console.log(`[${index + 1}/${items.length}] ${item.name}: ${vignetteDetails.length} vignette(s)`)
		} catch (error) {
			console.warn(`Unable to inspect CRAN page for ${item.name}: ${error.message}`)
		}
		if (index < items.length - 1) await wait(250)
	}
}

async function count_html_words(url) {
	const response = await fetch(url, request_options())
	if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
	const vignettePage = load(await response.text())
	vignettePage("script, style, noscript, nav, footer, pre, #TOC, .tocify, .navbar").remove()
	return count_words(vignettePage("body").text().replace(/\s+/g, " ").trim())
}

async function count_pdf_words(url) {
	const response = await fetch(url, request_options())
	if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
	const parser = new PDFParse({ data: new Uint8Array(await response.arrayBuffer()) })
	try {
		const result = await parser.getText()
		return count_words(result.text)
	} finally {
		await parser.destroy()
	}
}

function count_words(text) {
	return text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0
}

function request_options() {
	return {
		headers: { "User-Agent": "awesome-official-statistics-software-vignette-inspector" },
		signal: AbortSignal.timeout(30000)
	}
}

