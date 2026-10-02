"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadataDirectory = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadataDirectory, "metadata.json")

try {
	const items = JSON.parse(fs.readFileSync(metadataFile, "utf8"))
	if (!Array.isArray(items)) throw new Error(`${metadataFile} must contain a JSON array`)
	const usedInCounts = calculate_cran_used_in(items)

	for (const item of items) {
		if (!item?.name) {
			console.warn("Skipping metadata entry without a name")
			continue
		}

		const itemDirectory = path.join(metadataDirectory, item.name)
		const githubResponse = read_json_if_exists(path.join(itemDirectory, "pkg_gh.json"))
		const githubData = githubResponse?.data ?? item.pkg_gh?.data ?? item.pkg_gh ?? githubResponse ?? {}
		const downloads = read_json_if_exists(path.join(itemDirectory, "downloads.json"))
		const cranMetadata = read_json_if_exists(path.join(itemDirectory, "pkg_cran.json"))
		const mentions = read_json_if_exists(path.join(itemDirectory, "mentions.json"))
		const githubOwner = githubData.owner || {}
		const vignettes = Array.isArray(cranMetadata?.Vignettes) ? cranMetadata.Vignettes : null
		const metrics = {
			watchers_count: githubData.watchers_count ?? null,
			has_wiki: githubData.has_wiki ?? null,
			has_discussions: githubData.has_discussions ?? null,
			forks_count: githubData.forks_count ?? null,
			forks: githubData.forks ?? null,
			open_issues_count: githubData.open_issues_count ?? null,
			downloadsPer30Days: downloads?.downloadsPer30Days ?? null,
			downloadsUnavailableReason: downloads?.unavailableReason ?? null,
			VignetteBuilder: cranMetadata?.VignetteBuilder ?? null,
			vignetteCount: cranMetadata?.VignetteCount ?? null,
			vignettes,
			vignetteWordCount: vignettes
				? vignettes.reduce((total, vignette) => total + (Number.isFinite(vignette.wordCount) ? vignette.wordCount : 0), 0)
				: null,
			used_in: cranMetadata?.Package
				? usedInCounts.get(cranMetadata.Package.toLowerCase())?.size ?? 0
				: null,
			used_in_scope: cranMetadata?.Package ? "CRAN packages in metadata list" : null,
			mentions: mentions?.mentions ?? null,
			mentionsByJournal: mentions?.mentionsByJournal ?? null,
			mentionsFound: mentions?.mentionsFound ?? null,
			followers: githubOwner.followers ?? githubOwner.followers_count ?? null,
			watchers: githubData.watchers_count ?? null,
			subscriptions: githubData.subscribers_count ?? null,
			collaborators: githubData.collaborators_count ?? null,
			issues: githubData.open_issues_count ?? null,
			releases: githubData.releases_count ?? null,
			pull_requests: githubData.pull_requests_count ?? null
		}
		const awesomeMetric = calculate_awesome_metric(metrics)
		metrics.awesome_metric = awesomeMetric.score
		metrics.awesome_metric_breakdown = awesomeMetric.breakdown
		metrics.awesome_metric_method = "See metrics.md in this repo; metrics calculation is still experimental and subject to change."
		fs.mkdirSync(itemDirectory, { recursive: true })
		fs.writeFileSync(path.join(itemDirectory, "metrics.json"), JSON.stringify(metrics, null, 2), "utf8")
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

function calculate_awesome_metric(metrics) {
	const maturity = category_score([
		count_score(metrics.releases, 10),
		count_score(metrics.used_in, 20)
	])
	const documentation = category_score([
		count_score(metrics.vignetteCount, 5),
		count_score(metrics.vignetteWordCount, 50000),
		boolean_score(metrics.VignetteBuilder),
		boolean_score(metrics.has_wiki)
	])
	const use = category_score([
		count_score(metrics.downloadsPer30Days, 100000),
		count_score(metrics.mentions, 20)
	])
	const community = category_score([
		count_score(metrics.followers, 10000),
		count_score(metrics.watchers, 1000),
		count_score(metrics.subscriptions, 1000),
		count_score(metrics.forks, 500),
		count_score(metrics.collaborators, 50),
		count_score(metrics.issues, 100),
		count_score(metrics.pull_requests, 100),
		boolean_score(metrics.has_discussions)
	])
	const availableCategories = [maturity, documentation, use, community].filter(Number.isFinite)
	return {
		score: availableCategories.length
			? Math.round(availableCategories.reduce((total, value) => total + value, 0) / availableCategories.length * 10) / 10
			: null,
		breakdown: { maturity, documentation, use, community }
	}
}

function category_score(signals) {
	const availableSignals = signals.filter(Number.isFinite)
	if (!availableSignals.length) return null
	const normalizedAverage = availableSignals.reduce((total, value) => total + value, 0) / availableSignals.length
	return normalizedAverage * 5
}

function count_score(value, cap) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null
	return Math.min(1, Math.log1p(value) / Math.log1p(cap))
}

function boolean_score(value) {
	if (typeof value === "boolean") return value ? 1 : 0
	if (typeof value === "number" && Number.isFinite(value)) return value > 0 ? 1 : 0
	if (typeof value === "string") return value.trim() ? 1 : 0
	return null
}

function calculate_cran_used_in(items) {
	const dependencyFields = ["Depends", "Imports", "LinkingTo", "Suggests", "Enhances"]
	const usedIn = new Map()
	for (const item of items) {
		if (!item?.name) continue
		const cranMetadata = read_json_if_exists(path.join(metadataDirectory, item.name, "pkg_cran.json"))
		if (!cranMetadata?.Package) continue
		const userPackage = cranMetadata.Package.toLowerCase()
		for (const field of dependencyFields) {
			for (const dependency of get_dependency_names(cranMetadata[field])) {
				const dependencyName = dependency.toLowerCase()
				if (dependencyName === "r" || dependencyName === userPackage) continue
				if (!usedIn.has(dependencyName)) usedIn.set(dependencyName, new Set())
				usedIn.get(dependencyName).add(userPackage)
			}
		}
	}
	return usedIn
}

function get_dependency_names(dependencies) {
	if (Array.isArray(dependencies)) return dependencies.flatMap(get_dependency_names)
	if (dependencies && typeof dependencies === "object") return Object.keys(dependencies)
	if (typeof dependencies === "string") {
		return dependencies.split(",").map((dependency) => dependency.trim().split(/\s*\(/, 1)[0]).filter(Boolean)
	}
	return []
}

function read_json_if_exists(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"))
	} catch (error) {
		if (error.code !== "ENOENT") console.warn(`Unable to read ${filePath}: ${error.message}`)
		return undefined
	}
}
