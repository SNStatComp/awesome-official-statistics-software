"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { is_metadata_fresh, itemType, parseArguments, selectItems, showHelp, wait } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadataDirectory = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadataDirectory, "metadata.json")
const githubToken = process.env.GH_API_TOKEN

try {
	const options = parseArguments(process.argv.slice(2))
	if (options.help) {
		showHelp()
	} else {
		const items = JSON.parse(fs.readFileSync(metadataFile, "utf8"))
		if (!Array.isArray(items)) throw new Error(`${metadataFile} must contain a JSON array`)
		const selectedItems = [...new Map(selectItems(items, options)
			.filter((item) => item?.name)
			.map((item) => [item.name, item])).values()]
		console.log(`Total items to process: ${selectedItems.length}`)
		await process_items(selectedItems, options)
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

async function process_items(items, options) {
	for (const [index, item] of items.entries()) {
		const itemDirectory = path.join(metadataDirectory, item.name)
		fs.mkdirSync(itemDirectory, { recursive: true })
		if (!options.force && is_metadata_fresh(path.join(itemDirectory, "downloads.json"))) {
			console.log(`[${index + 1}/${items.length}] ${item.name} (from cache)`)
			continue
		}
		let result
		try {
			const type = get_item_type(item)
			if (type === "CRAN") result = await get_cran_downloads(item, itemDirectory)
			else if (type === "PYPI") result = await get_pypi_downloads(item)
			else if (type === "GH") result = await get_github_downloads(item, itemDirectory)
			else if (type === "GL") result = get_gitlab_downloads()
			else result = unavailable_downloads(item, `No download source is configured for ${type || "this platform"}`)
		} catch (error) {
			result = unavailable_downloads(item, error.message)
		}
		result.generatedAt = new Date().toISOString()
		fs.writeFileSync(path.join(itemDirectory, "downloads.json"), JSON.stringify(result, null, 2), "utf8")
		console.log(`${item.name}: ${result.downloadsPer30Days} downloads/30d${result.unavailableReason ? ` (${result.unavailableReason})` : ""}`)
		if (index < items.length - 1) await wait(250)
	}
}

async function get_cran_downloads(item) {
	const packageMetadata = read_json_if_exists(path.join(metadataDirectory, item.name, "pkg_cran.json"))
	const packageName = packageMetadata?.Package || get_cran_package_name(item.url) || item.name
	const source = `https://cranlogs.r-pkg.org/downloads/total/last-month/${encodeURIComponent(packageName)}`
	const response = await fetch(source, request_options())
	if (!response.ok) throw new Error(`CRAN logs returned HTTP ${response.status}`)
	const result = await response.json()
	if (!Array.isArray(result) || !result.length || !Number.isFinite(result[0].downloads)) {
		throw new Error("CRAN logs returned no monthly download total")
	}
	return {
		platform: "CRAN",
		metric: "downloadsPer30Days",
		downloadsPer30Days: result[0].downloads,
		periodStart: result[0].start,
		periodEnd: result[0].end,
		source
	}
}

async function get_pypi_downloads(item) {
	const packageName = get_pypi_package_name(item.url) || item.name
	const source = `https://pypistats.org/api/packages/${encodeURIComponent(packageName)}/recent`
	const response = await fetch(source, request_options())
	if (!response.ok) throw new Error(`PyPI Stats returned HTTP ${response.status}`)
	const result = await response.json()
	const downloads = result?.data?.last_month
	if (!Number.isFinite(downloads)) throw new Error("PyPI Stats returned no last-month download total")
	return {
		platform: "PyPI",
		metric: "downloadsPer30Days",
		method: "PyPI Stats last_month; excludes known mirrors",
		downloadsPer30Days: downloads,
		period: "last_month",
		source
	}
}

function get_gitlab_downloads() {
	return {
		platform: "GitLab",
		metric: "downloadsPer30Days",
		downloadsPer30Days: null,
		unavailableReason: "GitLab's public API exposes no project download count or download time series",
		source: "https://docs.gitlab.com/api/releases/"
	}
}

async function get_github_downloads(item, itemDirectory) {
	const { owner, repo } = get_github_repository(item.url)
	let trafficError
	if (githubToken) {
		try {
			return await get_github_traffic_downloads(owner, repo)
		} catch (error) {
			trafficError = error.message
		}
	}

	const cumulativeDownloads = await get_github_release_downloads(owner, repo)
	const downloadsFile = path.join(itemDirectory, "downloads.json")
	const previous = read_json_if_exists(downloadsFile)
	const today = new Date()
	const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
	const snapshots = Array.isArray(previous?.snapshots) ? previous.snapshots : []
	const baseline = snapshots
		.filter((snapshot) => Number.isFinite(snapshot.cumulativeDownloads) && Number.isFinite(Date.parse(snapshot.observedAt)) && Date.parse(snapshot.observedAt) < todayStart)
		.sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt))
		.at(-1)

	let downloadsPer30Days = null
	let rateBasisDays = null
	if (baseline) {
		const baselineDate = Date.parse(`${baseline.observedAt.slice(0, 10)}T00:00:00Z`)
		rateBasisDays = Math.round((todayStart - baselineDate) / 86400000)
		if (rateBasisDays > 0 && cumulativeDownloads >= baseline.cumulativeDownloads) {
			downloadsPer30Days = Math.round((cumulativeDownloads - baseline.cumulativeDownloads) * 30 / rateBasisDays)
		}
	}

	const snapshotsForToday = snapshots.filter((snapshot) => Date.parse(snapshot.observedAt) < todayStart)
	snapshotsForToday.push({ observedAt: today.toISOString(), cumulativeDownloads })
	return {
		platform: "GitHub",
		metric: "downloadsPer30Days",
		downloadsPer30Days,
		method: baseline ? "release asset download-count snapshot delta" : "release asset download-count snapshot",
		cumulativeReleaseAssetDownloads: cumulativeDownloads,
		rateBasisDays,
		...(downloadsPer30Days === 0 && !baseline
			? { unavailableReason: trafficError || "GH_API_TOKEN with repository traffic access is required for an immediate estimate" }
			: {}),
		snapshots: snapshotsForToday.slice(-400),
		source: `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases`
	}
}

async function get_github_traffic_downloads(owner, repo) {
	const source = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/traffic/clones`
	const response = await fetch(source, request_options(true))
	if (!response.ok) throw new Error(`GitHub traffic returned HTTP ${response.status}`)
	const traffic = await response.json()
	const cloneDays = Array.isArray(traffic.clones) ? traffic.clones.filter((day) => Number.isFinite(day.count)) : []
	if (!cloneDays.length) throw new Error("GitHub traffic returned no clone history")

	const firstDay = Date.parse(cloneDays[0].timestamp)
	const lastDay = Date.parse(cloneDays.at(-1).timestamp)
	if (!Number.isFinite(firstDay) || !Number.isFinite(lastDay)) throw new Error("GitHub traffic returned invalid dates")
	const periodDays = Math.max(1, Math.round((lastDay - firstDay) / 86400000) + 1)
	const cloneCount = cloneDays.reduce((total, day) => total + day.count, 0)
	return {
		platform: "GitHub",
		metric: "downloadsPer30Days",
		method: "repository clones over recent 14-day window, normalized to 30 days",
		downloadsPer30Days: Math.round(cloneCount * 30 / periodDays),
		repositoryClones: cloneCount,
		periodDays,
		periodStart: new Date(firstDay).toISOString().slice(0, 10),
		periodEnd: new Date(lastDay).toISOString().slice(0, 10),
		source
	}
}

async function get_github_release_downloads(owner, repo) {
	let totalDownloads = 0
	for (let page = 1; ; page++) {
		const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=100&page=${page}`
		const response = await fetch(url, request_options(true))
		if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`)
		const releases = await response.json()
		if (!Array.isArray(releases)) throw new Error("GitHub returned an invalid releases response")
		for (const release of releases) {
			for (const asset of release.assets || []) totalDownloads += asset.download_count || 0
		}
		if (releases.length < 100) return totalDownloads
	}
}

function get_github_repository(itemUrl) {
	const url = new URL(itemUrl)
	const [owner, repo] = url.pathname.split("/").filter(Boolean)
	if (url.hostname.toLowerCase() !== "github.com" || !owner || !repo) {
		throw new Error("GitHub downloads require a repository URL")
	}
	return { owner, repo: repo.replace(/\.git$/i, "") }
}

function get_item_type(item) {
	try {
		return itemType(item.url)
	} catch {
		return undefined
	}
}

function unavailable_downloads(item, reason) {
	return {
		platform: item.platform || get_item_type(item) || "unknown",
		metric: "downloadsPer30Days",
		downloadsPer30Days: null,
		unavailableReason: reason
	}
}

function get_cran_package_name(itemUrl) {
	const url = new URL(itemUrl)
	return url.searchParams.get("package") || undefined
}

function get_pypi_package_name(itemUrl) {
	const url = new URL(itemUrl)
	const parts = url.pathname.split("/").filter(Boolean)
	const projectIndex = parts.findIndex((part) => part.toLowerCase() === "project")
	return projectIndex === -1 ? undefined : parts[projectIndex + 1]
}

function request_options(isGithub = false) {
	const headers = { "User-Agent": "awesome-official-statistics-software-download-counter" }
	if (isGithub) {
		headers.Accept = "application/vnd.github+json"
		headers["X-GitHub-Api-Version"] = "2022-11-28"
		if (githubToken) headers.Authorization = `Bearer ${githubToken}`
	}
	return { headers, signal: AbortSignal.timeout(30000) }
}

function read_json_if_exists(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"))
	} catch (error) {
		if (error.code !== "ENOENT") throw error
		return undefined
	}
}
