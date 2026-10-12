"use strict"
import fs from "fs"
import https from "https"
import path from "path"
import { fileURLToPath } from "url"
import { is_metadata_fresh, itemType, parseArguments, selectItems, showHelp, wait } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadatadir = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadatadir, "metadata.json")
const pendingOperations = []
try {
	const options = parseArguments(process.argv.slice(2))
	if (options.help) {
		showHelp()
	} else {
		if (!fs.existsSync(metadatadir)) fs.mkdirSync(metadatadir, { recursive: true })
		const data = JSON.parse(fs.readFileSync(metadataFile, "utf8"))
		if (!Array.isArray(data)) throw new Error(`${metadataFile} must contain a JSON array`)
		const selectedData = selectItems(data, options)
		console.log(`Total items to process: ${selectedData.length}`)
		await process_data(selectedData, options)
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

async function process_data(data, options) {
	for (const [index, item] of data.entries()) {
		if (!item || !item.name || !item.url) throw new Error("Every software entry must have a name and URL")
		pendingOperations.length = 0
		const itemMetadataDir = path.join(metadatadir, item.name)
		if (!fs.existsSync(itemMetadataDir)) fs.mkdirSync(itemMetadataDir, { recursive: true })
		const metadataIsFresh = !options.force && is_metadata_fresh(path.join(itemMetadataDir, "pkg.json"))
		const parts = item.url.split("/")
		console.log(`[${index + 1}/${data.length}] ${itemType(item.url) || "other"}: ${item.name}${metadataIsFresh ? " (metadata cached)" : ""}`)
		if (metadataIsFresh) continue

		switch (parts[2]) {
			case "cran.r-project.org": {
				const name = parts[3].split("=")[1]
				download_svg(`https://www.r-pkg.org/badges/version-ago/${name}`, path.join(itemMetadataDir, "version.svg"))
				none_svg(path.join(itemMetadataDir, "latest.svg"))
				download_svg(`https://img.shields.io/cran/l/${name}?&style=plastic`, path.join(itemMetadataDir, "license.svg"))
				break
			}
			case "github.com": {
				const user = parts[3], repo = parts[4]
				if (parts.length === 4) {
					download_svg("https://img.shields.io/badge/GitHub-organization-blue&style=plastic", path.join(itemMetadataDir, "version.svg"))
					none_svg(path.join(itemMetadataDir, "latest.svg"))
					none_svg(path.join(itemMetadataDir, "license.svg"))
					break
				}
				download_svg(`https://img.shields.io/github/v/release/${user}/${repo}?display_name=tag&label=GitHub&include_prereleases&style=plastic`, path.join(itemMetadataDir, "version.svg"))
				download_svg(`https://img.shields.io/github/last-commit/${user}/${repo}?style=plastic`, path.join(itemMetadataDir, "latest.svg"))
				download_svg(`https://img.shields.io/github/license/${user}/${repo}?style=plastic`, path.join(itemMetadataDir, "license.svg"))
				break
			}
			case "gitlab.com": {
				let project = parts[3]
				for (let partIndex = 4; partIndex < parts.length; partIndex++) project += `/${parts[partIndex]}`
				download_svg(`https://img.shields.io/gitlab/v/release/${project}?include_prereleases&sort=semver&label=GitLab&style=plastic`, path.join(itemMetadataDir, "version.svg"))
				download_svg(`https://img.shields.io/gitlab/last-commit/${project}?gitlab_url=https%3A%2F%2Fgitlab.com&style=plastic`, path.join(itemMetadataDir, "latest.svg"))
				download_svg(`https://img.shields.io/gitlab/license/${project}?style=plastic`, path.join(itemMetadataDir, "license.svg"))
				break
			}
			case "pypi.org": {
				const name = parts[4]
				download_svg(`https://img.shields.io/pypi/v/${name}?label=PyPI&style=plastic`, path.join(itemMetadataDir, "version.svg"))
				none_svg(path.join(itemMetadataDir, "latest.svg"))
				download_svg(`https://img.shields.io/pypi/l/${name}?&style=plastic`, path.join(itemMetadataDir, "license.svg"))
				break
			}
			case "www.npmjs.com": {
				const name = parts[4]
				download_svg(`https://img.shields.io/npm/v/${name}?style=plastic`, path.join(itemMetadataDir, "version.svg"))
				none_svg(path.join(itemMetadataDir, "latest.svg"))
				download_svg(`https://img.shields.io/npm/l/${name}?&style=plastic`, path.join(itemMetadataDir, "license.svg"))
				break
			}
			default:
				download_svg(`https://img.shields.io/static/v1?label=other&message=${item.name}&color=blue?&style=plastic`, path.join(itemMetadataDir, "version.svg"))
				none_svg(path.join(itemMetadataDir, "latest.svg"))
				none_svg(path.join(itemMetadataDir, "license.svg"))
		}
		await Promise.all(pendingOperations)
		if (index < data.length - 1) await wait(2000)
	}
}

function download_svg(url, filePath) {
	const operation = new Promise((resolve, reject) => {
		https.get(url, (response) => {
			if (response.statusCode < 200 || response.statusCode >= 300) {
				response.resume()
				reject(new Error(`HTTP ${response.statusCode}`))
				return
			}
			const writeStream = fs.createWriteStream(filePath)
			response.pipe(writeStream)
			writeStream.on("finish", () => writeStream.close(resolve))
			writeStream.on("error", reject)
		}).on("error", reject)
	})
	const trackedOperation = operation.catch((error) => {
		console.error(`Error downloading badge ${url}:`, error.message)
		return fs.promises.writeFile(filePath, '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
	})
	pendingOperations.push(trackedOperation)
	return trackedOperation
}

function none_svg(filePath) {
	try {
		fs.writeFileSync(filePath, '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
	} catch (error) {
		console.error("error writing :", filePath)
	}
}