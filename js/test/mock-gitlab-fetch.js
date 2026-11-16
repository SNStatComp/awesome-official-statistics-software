import fs from "fs"

globalThis.fetch = async (url, options) => {
	fs.appendFileSync(process.env.MOCK_LOG, JSON.stringify({ url, headers: options.headers }) + "\n")
	if (process.env.MOCK_FAILURE && url.includes(process.env.MOCK_FAILURE)) {
		return new Response("error", { status: 429, statusText: "Too Many Requests" })
	}
	const data = url.endsWith("/languages")
		? { JavaScript: 30, Python: 21, Ruby: 20, HTML: 29 }
		: {
			license: { key: "mit" },
			forks_count: 7,
			open_issues_count: 3,
			wiki_access_level: "enabled",
			star_count: 99
		}
	return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
}
