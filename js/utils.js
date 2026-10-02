import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const gsbpmPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/GSBPM_5_1.json")
const supportedTypes = new Set(["GH", "CRAN", "PYPI", "GL"])
let gsbpm

export function find_gsbpm_name(code) {
	if (!gsbpm) gsbpm = JSON.parse(fs.readFileSync(gsbpmPath, "utf8"))
	const parts = code.split(".")
	if (parts.length > 0) {
		for (const phase of gsbpm.phases) {
			if (parts[0] === phase.phase_code) {
				if (parts.length === 1) return phase.phase_name
				for (const subProcess of phase.sub_processes) {
					if (code === subProcess.sub_process_code) return subProcess.sub_process_name
				}
			}
		}
	}
	return "unknown gsbpm"
}

export function parseArguments(argumentsList) {
	if (argumentsList.length === 1 && ["--help", "-h"].includes(argumentsList[0])) {
		return { help: true }
	}

	let maximumItems
	let type
	let itemName
	let force = false
	const scriptName = process.argv[1]?.split(/[\\/]/).pop() || "script.js"
	const usage = `Usage: node ${scriptName} [--max N] [--type GH|CRAN|PYPI|GL] [--name ITEM] [--force] [--help]`
	const setOption = (option, value) => {
		if (option === "max") {
			if (maximumItems !== undefined) throw new Error("Maximum items can only be specified once")
			maximumItems = Number(value)
			if (!/^\d+$/.test(value) || !Number.isSafeInteger(maximumItems)) {
				throw new Error("Maximum items must be a non-negative integer")
			}
			return
		}
		if (option === "type") {
			if (type !== undefined) throw new Error("Item type can only be specified once")
			type = value.toUpperCase()
			if (!supportedTypes.has(type)) throw new Error("Type must be one of: GH, CRAN, PYPI, GL")
			return
		}
		if (option === "name") {
			if (itemName !== undefined) throw new Error("Item name can only be specified once")
			if (!value) throw new Error("Item name cannot be empty")
			itemName = value
		}
	}

	for (let index = 0; index < argumentsList.length; index++) {
		const argument = argumentsList[index]
		if (!argument.startsWith("--")) throw new Error(usage)
		const separator = argument.indexOf("=")
		const option = argument.slice(2, separator === -1 ? undefined : separator)
		if (option === "force") {
			if (separator !== -1) throw new Error("--force does not take a value")
			if (force) throw new Error("--force can only be specified once")
			force = true
			continue
		}
		if (!["max", "type", "name"].includes(option)) throw new Error(usage)
		const value = separator === -1 ? argumentsList[++index] : argument.slice(separator + 1)
		if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for --${option}`)
		setOption(option, value)
	}

	return { maximumItems, type, itemName, force }
}

export function showHelp(scriptName) {
	console.log(`Usage: node ${scriptName} [options]`)
	console.log("Options:")
	console.log("  --max N        Process at most N items")
	console.log("  --type TYPE    Process only GH, CRAN, PYPI, or GL items")
	console.log("  --name ITEM    Process only the item with this exact name")
	console.log("  --force        Ignore cached metadata and refresh selected items")
	console.log("  --help, -h     Show this help")
	console.log("Options may be used alone or together, in any order.")
	console.log(`Example: node ${scriptName} --type CRAN --max 10`)
}

export function selectItems(data, options) {
	let filteredData = options.type
		? data.filter((item) => itemType(item.url) === options.type)
		: data
	if (options.itemName !== undefined) {
		filteredData = filteredData.filter((item) => item.name === options.itemName)
	}
	return options.maximumItems === undefined
		? filteredData
		: filteredData.slice(0, options.maximumItems)
}

export function itemType(itemUrl) {
	const hostname = new URL(itemUrl).hostname.toLowerCase()
	if (hostname === "github.com") return "GH"
	if (hostname === "cran.r-project.org") return "CRAN"
	if (hostname === "pypi.org") return "PYPI"
	if (hostname === "gitlab.com") return "GL"
	return undefined
}

export function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export function is_metadata_fresh(pkgFile) {
	try {
		const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"))
		const generatedAt = Date.parse(pkg.generatedAt)
		const age = Date.now() - generatedAt
		return Number.isFinite(generatedAt) && age >= 0 && age < 7 * 24 * 60 * 60 * 1000
	} catch {
		return false
	}
}
