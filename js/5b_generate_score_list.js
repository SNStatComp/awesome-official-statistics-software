"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { parseArguments, selectItems, showHelp } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const metadataDirectory = path.resolve(scriptDirectory, "../metadata")
const metadataFile = path.join(metadataDirectory, "metadata.json")
const outputFile = path.resolve(scriptDirectory, "../metrics_scores.md")
const breakdownFields = ["maturity", "documentation", "use", "community"]

try {
	const options = parseArguments(process.argv.slice(2))
	if (options.help) {
		showHelp()
	} else {
		const items = JSON.parse(fs.readFileSync(metadataFile, "utf8"))
		if (!Array.isArray(items)) throw new Error(`${metadataFile} must contain a JSON array`)

		const rows = [...new Map(selectItems(items, options)
			.filter((item) => item?.name)
			.map((item) => [item.name, item])).values()]
			.map((item) => ({ item, metrics: read_metrics(item.name) }))
			.sort((left, right) => {
				const leftScore = left.metrics?.awesome_metric
				const rightScore = right.metrics?.awesome_metric
				const leftHasScore = Number.isFinite(leftScore)
				const rightHasScore = Number.isFinite(rightScore)
				if (leftHasScore !== rightHasScore) return leftHasScore ? -1 : 1
				if (leftHasScore && leftScore !== rightScore) return rightScore - leftScore
				return left.item.name.localeCompare(right.item.name)
			})

		const lines = [
			"## AWESOME METRICS (AI-designed, very experimental)",
            "",
            "- Methodology: [metrics calculation](metrics_calculation.md)",
			"",
			`Generated: ${new Date().toISOString()}`,
			"",
			"Scores are sorted from highest to lowest. Select a score to open that package's full `metrics.json`.",
			"",
			`| Rank | Package | Score / 5 | Maturity | Documentation | Use | Community |`,
			`| ---: | --- | ---: | ---: | ---: | ---: | ---: |`
		]

		rows.forEach(({ item, metrics }, index) => {
			const score = format_score(metrics?.awesome_metric)
			const scoreLink = `[${score}](metadata/${encodeURIComponent(item.name)}/metrics.json)`
			const packageCell = item.url
				? `[${escape_table(item.name)}](${item.url})`
				: escape_table(item.name)
			const components = breakdownFields.map((field) => format_score(metrics?.awesome_metric_breakdown?.[field]))
			lines.push(`| ${index + 1} | ${packageCell} | ${scoreLink} | ${components.join(" | ")} |`)
		})

		fs.writeFileSync(outputFile, `${lines.join("\n")}\n`, "utf8")
		console.log(`Wrote scores for ${rows.length} item(s) to ${outputFile}`)
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}

function read_metrics(packageName) {
	try {
		return JSON.parse(fs.readFileSync(path.join(metadataDirectory, packageName, "metrics.json"), "utf8"))
	} catch (error) {
		if (error.code !== "ENOENT") console.warn(`Unable to read metrics for ${packageName}: ${error.message}`)
		return null
	}
}

function format_score(value) {
	return Number.isFinite(value) ? value.toFixed(1) : "N/A"
}

function escape_table(value) {
	return String(value).replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ")
}
