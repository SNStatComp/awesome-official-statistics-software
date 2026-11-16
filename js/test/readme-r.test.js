import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const jsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const rootDir = path.dirname(jsDir)

test("generates an R-only README with the correct grouping and badge mode", (t) => {
	const root = fs.mkdtempSync(path.join(jsDir, "readme-test-"))
	t.after(() => fs.rmSync(root, { recursive: true, force: true }))
	for (const dir of ["js", "data", "metadata"]) fs.mkdirSync(path.join(root, dir))
	for (const script of ["5a_generate_readme.js", "utils.js"]) {
		fs.copyFileSync(path.join(jsDir, script), path.join(root, "js", script))
	}
	for (const template of ["template.md", "templateR.md"]) {
		fs.copyFileSync(path.join(rootDir, "data", template), path.join(root, "data", template))
	}
	fs.copyFileSync(path.join(rootDir, "news.md"), path.join(root, "news.md"))
	const items = [
		{ name: "cran", type: "R package", url: "https://cran.r-project.org/package=cran", gsbpm_number: "2", gsbpm_name: "First" },
		{ name: "other", type: "Python", url: "https://pypi.org/project/other", gsbpm_number: "2", gsbpm_name: "First" },
		{ name: "github", type: "R package", url: "https://github.com/group/github", gsbpm_number: "3", gsbpm_name: "Second" },
		{ name: "collection", type: "R packages", url: "https://github.com/group", gsbpm_number: "3", gsbpm_name: "Second" },
		{ name: "java", type: "Java application", url: "https://github.com/group/java", gsbpm_number: "4", gsbpm_name: "Empty" }
	]
	fs.writeFileSync(path.join(root, "metadata", "metadata.json"), JSON.stringify(items))
	for (const badgeMode of ["false", "true"]) {
		const result = spawnSync(process.execPath, ["5a_generate_readme.js"], {
			cwd: path.join(root, "js"),
			encoding: "utf8",
			env: { ...process.env, GITHUB_ACTIONS: badgeMode }
		})
		assert.equal(result.status, 0, result.stderr)
		const full = fs.readFileSync(path.join(root, "README.md"), "utf8")
		const filtered = fs.readFileSync(path.join(root, "README_R.md"), "utf8")
		for (const name of ["cran", "github", "collection"]) {
			assert.ok(filtered.includes(`metadata/${name}/metrics.svg`))
		}
		for (const name of ["other", "java"]) {
			assert.ok(full.includes(`metadata/${name}/version.svg`))
			assert.ok(!filtered.includes(`metadata/${name}/metrics.svg`))
		}
		assert.match(filtered, /#### First /)
		assert.match(filtered, /#### Second /)
		assert.doesNotMatch(filtered, /#### Empty /)
		assert.equal(filtered.includes("raw.githubusercontent.com&#x2F;SNStatComp&#x2F;"), badgeMode === "true")
		assert.match(filtered, /## AWESOME METRICS/)
		assert.match(filtered, /## Contributions/)
	}
})
