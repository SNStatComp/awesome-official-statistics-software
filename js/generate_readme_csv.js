"use strict"
const fs = require('fs')
const yaml = require('js-yaml')
const Mustache = require('mustache')
const papa = require('papaparse')

const template = fs.readFileSync('./../data/template.md', 'utf8')
const data = yaml.load(fs.readFileSync('./../data/software.yaml', 'utf8'))

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

//fs.writeFileSync("test.json", JSON.stringify(res))

// Generate readme:
let readme = Mustache.render(template, json_mustache)
fs.writeFileSync("./../README.md", readme)

// Generate csv for visuals:
fs.writeFileSync('./../data/software.csv', papa.unparse(data, {delimiter: ",", newline: "\r\n", quotes: true}, {encoding: 'utf8'}));
