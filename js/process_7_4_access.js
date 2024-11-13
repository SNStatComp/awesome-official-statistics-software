"use strict"
import fs from "fs"
import yaml from "js-yaml"
import papa from "papaparse"

let matrix = []
let cnt = 0

// Read data:
const software = yaml.load(fs.readFileSync('./../data/software.yaml', 'utf8'))
//const standards = yaml.load(fs.readFileSync('./../data/standards.yaml', 'utf8'))
let json_stat_providers = papa.parse(
	fs.readFileSync('./../data/data_providers/JSON-STAT_providers_cleaned.csv', {encoding: 'utf8'}),
	{delimiter: ";", header: true, 	skipEmptyLines: true}
)
let rsdmx_data_providers = papa.parse(
	fs.readFileSync('./../data/data_providers/rsdmx_data_providers_cleaned.csv', {encoding: 'utf8'}),
	{delimiter: ",", header: true, 	skipEmptyLines: true}
)
let Psdmx_data_providers = papa.parse(
	fs.readFileSync('./../data/data_providers/Python_sdmx_data_providers_cleaned.csv', {encoding: 'utf8'}),
	{delimiter: ",", header: true, 	skipEmptyLines: true}
)
let PX_data_providers = papa.parse(
	fs.readFileSync('./../data/data_providers/PX_providers_cleaned.csv', {encoding: 'utf8'}),
	{delimiter: ";", header: true, 	skipEmptyLines: true}
)

// Clean and merge dataproviders from all sources:
let dataproviders = []
for (const o of json_stat_providers.data) {
	dataproviders.push({name: o.name, standard: "JSON-STAT", url: o.url})
}
for (const o of rsdmx_data_providers.data) {
	dataproviders.push({name: o.agencyId, standard: "SDMX", url: null})
}
for (const o of Psdmx_data_providers.data) {
	if (!dataproviders.find((el) => el.name == o.id && el.standard == "SDMX"))
		dataproviders.push({name: o.id, standard: "SDMX", url: o.url})
}
for (const o of PX_data_providers.data) {
	dataproviders.push({name: o.name, standard: "PX", url: o.url})
}
// Merge providers from sdmx4rest: they overlap, doesnt add anything
// Merge providers who are registries: no, special category, no dataprovider usually

// Generate matrix:
for (const o of software) {
	if (o.gsbpm_number != '7.4') continue
	//if (o.type != 'R package') continue
	cnt++
	
	if (o.access_to && o.access_to != []) {
		for (const el of o.access_to) {
			
			if (el.match(/^all /)) {
				let standard = el.substring(4)
				// Add all providers of standard:
				for (const provider of dataproviders) {
					if (provider.standard == standard) {
						add_cell(o.name, o.type, standard, provider.name)
					}
				}
			}
			else {
				// Add element as provider:
				add_cell(o.name, o.type, o.standard, el)
			}
		}
	}
}

// Adds cell to matrix, if not already in matrix:
function add_cell(software, type, standard, provider) {
	for (const el in matrix) if (el.software == software && el.provider == provider) return
	matrix.push({software: software, type: type, standard: standard || "other", provider: provider})
}

// statistics:
console.log("# pkgs: "+ cnt)

// Write matrix:
fs.writeFileSync('./../data/7_4_matrix.json', JSON.stringify(matrix));





