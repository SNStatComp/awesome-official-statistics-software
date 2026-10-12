"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { parseArguments, selectItems, showHelp } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadataDirectory = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadataDirectory, "metadata.json")
const templateFile = path.resolve(scriptDirectory, "../data/metrics.svg")
const metricValuePattern = /(<!-- Metric Value -->\s*<text\b[^>]*>)[^<]*(<\/text>)/

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
		const template = fs.readFileSync(templateFile, "utf8")
		if (!metricValuePattern.test(template)) {
			throw new Error(`${templateFile} does not contain the expected Metric Value text element`)
		}
		console.log(`Total items to process: ${selectedItems.length}`)
		for (const [index, item] of selectedItems.entries()) {
			const itemDirectory = path.join(metadataDirectory, item.name)
			const metrics = read_json_if_exists(path.join(itemDirectory, "metrics.json"))
			const score = metrics?.awesome_metric
			const metricValue = Number.isFinite(score) && score >= 0 && score <= 5
				? score.toFixed(1)
				: "N/A"
			const badge = template.replace(metricValuePattern, (_, openingTag, closingTag) => `${openingTag}${metricValue}${closingTag}`)
			fs.mkdirSync(itemDirectory, { recursive: true })
			fs.writeFileSync(path.join(itemDirectory, "metrics.svg"), badge, "utf8")
			console.log(`[${index + 1}/${selectedItems.length}] ${item.name}: ${metricValue}/5.0`)
		}
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

function read_json_if_exists(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"))
	} catch (error) {
		if (error.code !== "ENOENT") console.warn(`Unable to read ${filePath}: ${error.message}`)
		return undefined
	}
}
