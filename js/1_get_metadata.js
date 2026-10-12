"use strict"
import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"
import { fileURLToPath } from "url"
import { parseArguments, showHelp } from "./utils.js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const scriptPath = fileURLToPath(import.meta.url)

try {
	const argumentsList = process.argv.slice(2)
	const options = parseArguments(argumentsList)
	if (options.help) {
		showHelp()
	} else {
		const scripts = fs.readdirSync(scriptDirectory)
			.filter((name) => /^1.*_.*\.js$/.test(name) && path.join(scriptDirectory, name) !== scriptPath)
			.sort()

		for (const script of scripts) {
			console.log(`\nRunning ${script}`)
			const result = spawnSync(process.execPath, [path.join(scriptDirectory, script), ...argumentsList], {
				cwd: scriptDirectory,
				env: process.env,
				stdio: "inherit"
			})

			if (result.error) throw result.error
			if (result.status !== 0) {
				process.exitCode = result.status ?? 1
				console.error(`Stopped after ${script} exited with status ${process.exitCode}`)
				break
			}
		}
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}
