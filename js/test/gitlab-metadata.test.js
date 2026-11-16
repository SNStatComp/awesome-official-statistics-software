import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const jsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const mock = path.join(jsDir, "test", "mock-gitlab-fetch.js")
const scripts = ["1a_get_repo_metadata.js", "2_aggregate_metadata.js", "3_calculate_metrics.js", "utils.js"]

function fixture(t, item) {
	const root = fs.mkdtempSync(path.join(jsDir, "gitlab-test-"))
	t.after(() => fs.rmSync(root, { recursive: true, force: true }))
	for (const dir of ["js", "data", "metadata"]) fs.mkdirSync(path.join(root, dir))
	for (const script of scripts) fs.copyFileSync(path.join(jsDir, script), path.join(root, "js", script))
	fs.writeFileSync(path.join(root, "data", "software.yaml"), JSON.stringify([item]))
	return root
}

function run(root, script, args = [], env = {}) {
	const result = spawnSync(process.execPath, ["--import", pathToFileURL(mock).href, path.join(root, "js", script), ...args], {
		encoding: "utf8",
		env: { ...process.env, GITLAB_API_TOKEN: "", MOCK_LOG: path.join(root, "requests.log"), ...env }
	})
	if (result.error) throw result.error
	return result
}

function read(root, ...parts) {
	return JSON.parse(fs.readFileSync(path.join(root, ...parts), "utf8"))
}

test("collects, caches, aggregates and scores GitLab project metadata", (t) => {
	const root = fixture(t, { name: "project", url: "https://gitlab.com/group/subgroup/project.git/" })
	const token = "test-token"
	let result = run(root, scripts[0], [], { GITLAB_API_TOKEN: token })
	assert.equal(result.status, 0, result.stderr)
	const requests = fs.readFileSync(path.join(root, "requests.log"), "utf8").trim().split("\n").map(JSON.parse)
	assert.deepEqual(requests.map((request) => request.url), [
		"https://gitlab.com/api/v4/projects/group%2Fsubgroup%2Fproject?license=true",
		"https://gitlab.com/api/v4/projects/group%2Fsubgroup%2Fproject/languages"
	])
	assert.ok(requests.every((request) => request.headers["PRIVATE-TOKEN"] === token))
	const pkg = read(root, "metadata", "project", "pkg.json")
	assert.equal(pkg.license, "mit")
	assert.deepEqual(pkg.languages, ["JavaScript", "Python"])
	assert.equal(read(root, "metadata", "project", "pkg_gl.json").forks_count, 7)
	assert.equal(read(root, "metadata", "project", "pkg_gl_languages.json").HTML, 29)
	result = run(root, scripts[0])
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stdout, /from cache/)
	assert.equal(fs.readFileSync(path.join(root, "requests.log"), "utf8").trim().split("\n").length, 2)
	for (const script of scripts.slice(1, 3)) {
		result = run(root, script)
		assert.equal(result.status, 0, result.stderr)
	}
	const aggregate = read(root, "metadata", "metadata.json")[0]
	assert.equal(aggregate.pkg_gl.forks_count, 7)
	assert.equal(aggregate.pkg_gl_languages.Python, 21)
	const metrics = read(root, "metadata", "project", "metrics.json")
	assert.equal(metrics.forks, 7)
	assert.equal(metrics.issues, 3)
	assert.equal(metrics.has_wiki, true)
	assert.equal(metrics.watchers, null)
	result = run(root, scripts[0], ["--force"])
	assert.equal(result.status, 0, result.stderr)
	assert.equal(fs.readFileSync(path.join(root, "requests.log"), "utf8").trim().split("\n").length, 4)
})

test("refreshes old GitLab caches and preserves configured overrides", (t) => {
	const root = fixture(t, {
		name: "project", url: "https://gitlab.com/group/project",
		license: "custom", languages: ["Excel"]
	})
	const dir = path.join(root, "metadata", "project")
	fs.mkdirSync(dir)
	fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify({ generatedAt: new Date().toISOString() }))
	const result = run(root, scripts[0])
	assert.equal(result.status, 0, result.stderr)
	const pkg = read(root, "metadata", "project", "pkg.json")
	assert.equal(pkg.license, "custom")
	assert.deepEqual(pkg.languages, ["Excel"])
	const requests = fs.readFileSync(path.join(root, "requests.log"), "utf8").trim().split("\n").map(JSON.parse)
	assert.deepEqual(requests[0].headers, {})
})

test("reports request failures without writing or refreshing cached metadata", (t) => {
	const root = fixture(t, { name: "project", url: "https://gitlab.com/group/project" })
	let result = run(root, scripts[0], [], { MOCK_FAILURE: "/languages" })
	assert.equal(result.status, 1)
	assert.match(result.stderr, /HTTP 429/)
	assert.equal(fs.existsSync(path.join(root, "metadata", "project", "pkg.json")), false)
	assert.equal(fs.existsSync(path.join(root, "metadata", "project", "pkg_gl.json")), false)
	result = run(root, scripts[0])
	assert.equal(result.status, 0, result.stderr)
	const pkgFile = path.join(root, "metadata", "project", "pkg.json")
	const previous = fs.readFileSync(pkgFile, "utf8")
	result = run(root, scripts[0], ["--force"], { MOCK_FAILURE: "/languages" })
	assert.equal(result.status, 1)
	assert.equal(fs.readFileSync(pkgFile, "utf8"), previous)
})
