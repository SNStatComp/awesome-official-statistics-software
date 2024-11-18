"use strict"
import fs from "fs"
import https from 'https'
import yaml from "js-yaml"

let matrix = []
let cnt = 0
	
const data = yaml.load(fs.readFileSync('./../data/software.yaml', 'utf8'))

for (const o of data) {

	// Only R packages in "access_to":
	if (o.gsbpm_number != "7.4") continue
	if (o.type != "R package") continue

	// Only if it has features:
	if (!o.features) continue

	// Add features to matrix:
	for (const f of o.features) {
		console.log(f)
		matrix.push({software: o.name, type: o.type, feature: f})
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
fs.writeFileSync('./../data/7_4_feature_x_package.json', JSON.stringify(matrix));