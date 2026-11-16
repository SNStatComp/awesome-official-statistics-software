import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const jsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const mock = pathToFileURL(path.join(jsDir, "test", "mock-crossref-fetch.js")).href

function fixture(t) {
	const root = fs.mkdtempSync(path.join(jsDir, "mentions-test-"))
	t.after(() => fs.rmSync(root, { recursive: true, force: true }))
	for (const dir of ["js", "data", "metadata"]) fs.mkdirSync(path.join(root, dir))
	for (const script of ["1d_get_mentions.js", "utils.js"]) {
		fs.copyFileSync(path.join(jsDir, script), path.join(root, "js", script))
	}
	const items = ["Alpha", "Beta"].map((name) => ({ name, url: `https://github.com/example/${name}` }))
	fs.writeFileSync(path.join(root, "metadata", "metadata.json"), JSON.stringify(items))
	fs.writeFileSync(path.join(root, "data", "statistics_journals.json"), JSON.stringify({
		journals: [{ id: "journal", title: "Journal", mentionSearch: { provider: "crossref", issn: "1234-5678" } }]
	}))
	return root
}

function run(root, args, extraEnv = {}) {
	const result = spawnSync(process.execPath, ["--import", mock, path.join(root, "js", "1d_get_mentions.js"), ...args], {
		encoding: "utf8",
		env: { ...process.env, MOCK_LOG: path.join(root, "requests.log"), MOCK_FAILURE: "", ...extraEnv }
	})
	assert.equal(result.status, 0, result.stderr)
	return result
}

function requests(root) {
	const log = path.join(root, "requests.log")
	return fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n") : []
}

function read(root, ...parts) {
	return JSON.parse(fs.readFileSync(path.join(root, ...parts), "utf8"))
}

test("reuses a journal corpus for another package and respects force and expiry", (t) => {
	const root = fixture(t)
	run(root, ["--name", "Alpha"])
	assert.equal(requests(root).length, 1)
	const cache = read(root, ".cache", "mentions", "1234-5678.json")
	assert.equal(cache.issn, "1234-5678")
	assert.equal(cache.works.length, 1)
	const result = run(root, ["--name", "Beta"])
	assert.match(result.stdout, /journal corpus from cache/)
	assert.equal(requests(root).length, 1)
	const beta = read(root, "metadata", "Beta", "mentions.json")
	assert.equal(beta.mentions, 1)
	assert.equal(beta.mentionsFound[0].doi, "10.1234/1234-5678")
	run(root, ["--name", "Beta"])
	assert.equal(requests(root).length, 1)
	run(root, ["--name", "Beta", "--force"])
	assert.equal(requests(root).length, 2)
	const cacheFile = path.join(root, ".cache", "mentions", "1234-5678.json")
	const expired = read(root, ".cache", "mentions", "1234-5678.json")
	expired.generatedAt = new Date(Date.now() - 8 * 86400000).toISOString()
	fs.writeFileSync(cacheFile, JSON.stringify(expired))
	fs.unlinkSync(path.join(root, "metadata", "Alpha", "mentions.json"))
	run(root, ["--name", "Alpha"])
	assert.equal(requests(root).length, 3)
})

test("does not cache failed requests and refreshes invalid cache contents", (t) => {
	const root = fixture(t)
	run(root, ["--name", "Alpha"], { MOCK_FAILURE: "1234-5678" })
	const cacheFile = path.join(root, ".cache", "mentions", "1234-5678.json")
	assert.equal(fs.existsSync(cacheFile), false)
	run(root, ["--name", "Beta"])
	assert.equal(requests(root).length, 2)
	const previous = fs.readFileSync(cacheFile, "utf8")
	run(root, ["--name", "Beta", "--force"], { MOCK_FAILURE: "1234-5678" })
	assert.equal(fs.readFileSync(cacheFile, "utf8"), previous)
	fs.writeFileSync(cacheFile, JSON.stringify({ issn: "1234-5678", generatedAt: new Date().toISOString(), works: {} }))
	fs.unlinkSync(path.join(root, "metadata", "Alpha", "mentions.json"))
	const result = run(root, ["--name", "Alpha"])
	assert.equal(requests(root).length, 4)
	assert.equal(read(root, ".cache", "mentions", "1234-5678.json").works.length, 1)
	assert.match(result.stdout, /retrieved 1 Crossref records/)
	assert.match(result.stderr, /Invalid journal corpus cache/)
})

test("refreshes only the expired journal when another corpus is fresh", (t) => {
	const root = fixture(t)
	const configFile = path.join(root, "data", "statistics_journals.json")
	const config = read(root, "data", "statistics_journals.json")
	config.journals.push({ id: "second", title: "Second", mentionSearch: { provider: "crossref", issn: "8765-4321" } })
	fs.writeFileSync(configFile, JSON.stringify(config))
	run(root, ["--name", "Alpha"])
	assert.deepEqual(requests(root), ["1234-5678", "8765-4321"])
	const cacheFile = path.join(root, ".cache", "mentions", "1234-5678.json")
	const cache = read(root, ".cache", "mentions", "1234-5678.json")
	cache.generatedAt = new Date(Date.now() - 8 * 86400000).toISOString()
	fs.writeFileSync(cacheFile, JSON.stringify(cache))
	run(root, ["--name", "Beta"])
	assert.deepEqual(requests(root), ["1234-5678", "8765-4321", "1234-5678"])
	assert.equal(read(root, "metadata", "Beta", "mentions.json").mentions, 2)
})
