import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const jsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("scores only R packages and collections, ranked with missing scores last", (t) => {
	const root = fs.mkdtempSync(path.join(jsDir, "score-test-"))
	t.after(() => fs.rmSync(root, { recursive: true, force: true }))
	for (const dir of ["js", "metadata"]) fs.mkdirSync(path.join(root, dir))
	for (const script of ["5b_generate_score_list.js", "utils.js"]) {
		fs.copyFileSync(path.join(jsDir, script), path.join(root, "js", script))
	}
	const items = [
		{ name: "cran", type: "R package", url: "https://cran.r-project.org/package=cran" },
		{ name: "github+space", type: "R package", url: "https://github.com/group/github" },
		{ name: "collection", type: "R packages", url: "https://github.com/group" },
		{ name: "python", type: "Python", url: "https://pypi.org/project/python" }
	]
	fs.writeFileSync(path.join(root, "metadata", "metadata.json"), JSON.stringify(items))
	for (const [name, score] of [["cran", 2], ["github+space", 4], ["python", 5]]) {
		const dir = path.join(root, "metadata", name)
		fs.mkdirSync(dir)
		fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify({ awesome_metric: score }))
	}
	const run = (...args) => {
		const result = spawnSync(process.execPath, [path.join(root, "js", "5b_generate_score_list.js"), ...args], { encoding: "utf8" })
		assert.equal(result.status, 0, result.stderr)
		return fs.readFileSync(path.join(root, "metrics_scores.md"), "utf8")
	}
	const output = run()
	const table = output.split(/\r?\n/).filter((line) => line.startsWith("|"))
	for (const line of table) assert.equal(line.split("|").length - 2, 7, `Incorrect table column count: ${line}`)
	assert.match(output, /\| 1 \| \[github\+space\]/)
	assert.match(output, /\| 2 \| \[cran\]/)
	assert.match(output, /\| 3 \| \[collection\].*\| N\/A \|/)
	assert.match(output, /\| Score \|/)
	assert.doesNotMatch(output, /Score \/ 5/)
	assert.ok(output.includes("[![Metrics](metadata/github%2Bspace/metrics.svg)](metadata/github%2Bspace/metrics.json)"))
	assert.ok(output.includes("[![Metrics](metadata/collection/metrics.svg)](metadata/collection/metrics.json)"))
	assert.doesNotMatch(output, /\[python\]/)
	const selected = run("--type", "GH")
	assert.match(selected, /\| 1 \| \[github\+space\]/)
	assert.match(selected, /\| 2 \| \[collection\]/)
	assert.doesNotMatch(selected, /\[cran\]/)
})
