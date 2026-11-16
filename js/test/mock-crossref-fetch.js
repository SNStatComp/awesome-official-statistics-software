import fs from "node:fs"

globalThis.fetch = async (url) => {
	const request = new URL(url)
	const issn = request.searchParams.get("filter").slice(5)
	fs.appendFileSync(process.env.MOCK_LOG, `${issn}\n`)
	if (process.env.MOCK_FAILURE === issn) {
		return new Response("error", { status: 503 })
	}
	return Response.json({
		message: {
			items: [{
				DOI: `10.1234/${issn}`,
				title: ["Alpha and Beta in official statistics"],
				abstract: "<p>Example article</p>",
				author: [{ given: "A", family: "Writer" }],
				published: { "date-parts": [[2025]] }
			}]
		}
	})
}
