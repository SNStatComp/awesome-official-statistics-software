"use strict"
import fs from "fs"
import yaml from "js-yaml"
import Mustache from "mustache"
import papa from "papaparse"

const template = fs.readFileSync('./../data/template.md', 'utf8')
const data = yaml.load(fs.readFileSync('./../data/software.yaml', 'utf8'))
const newsLines = fs.readFileSync('./../news.md', 'utf8').split(/\r?\n/)
const newsHeadingIndex = newsLines.findIndex((line) => /^## News\s*$/.test(line))
if (newsHeadingIndex === -1) throw new Error('news.md must contain a "## News" heading')

const news = []
for (const line of newsLines.slice(newsHeadingIndex + 1)) {
	if (/^#{1,6}\s/.test(line)) break
	if (line.startsWith('- ')) news.push(line)
	if (news.length === 5) break
}

const badgeURL = process.env.GITHUB_ACTIONS === 'true'
	? 'https://raw.githubusercontent.com/SNStatComp/awesome-official-statistics-software/master/'
	: ''


// build json structure for Mustache:
let json_mustache = data.reduce((a, c) => {
	let group = a.groups.find((item) => item.number == c.gsbpm_number)
	if (group)
		group.items.push(c)
	else
		a.groups.push({
			number: c.gsbpm_number,
			name: c.gsbpm_name,
			items: [c]
		})
	return a
}, {groups: []} )
json_mustache.badgeURL = badgeURL
json_mustache.news = news

// Generate readme:
let readme = Mustache.render(template, json_mustache)
fs.writeFileSync("./../README.md", readme)

// Generate csv for visuals:
fs.writeFileSync('./../data/software.csv', papa.unparse(data, {delimiter: ",", newline: "\r\n", quotes: true}, {encoding: 'utf8'}));
