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

	// Add item to matrix with all its features:
	cnt++
	for (const f of o.features) 
		matrix.push({software: o.name, type: o.type, feature: f})

}

// statistics:
console.log("# pkgs: "+ cnt)

// Write matrix:
fs.writeFileSync('./../data/7_4_feature_x_package.json', JSON.stringify(matrix));