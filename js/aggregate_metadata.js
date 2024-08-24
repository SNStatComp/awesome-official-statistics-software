"use strict"
import fs from "fs"
import yaml from "js-yaml"

const metadatadir = "../metadata"

try {
    let fileContents = fs.readFileSync('./../data/software.yaml', 'utf8')
    let data = yaml.load(fileContents)
    process_data(data)
} catch (e) {
    console.log(e)
}

function process_data(data) {
	for (const item of data) {
        
        let meta = JSON.parse(fs.readFileSync(`${metadatadir}/${item.name}/pkg.json`))
        item.license = meta.license
        item.licenseSimple = item.license.split(/[_ -]/)[0]
        item.platform = meta.platform
    }

	// Write a json file with original and derived data in metadata folder, for visualisations and derived work:
	fs.writeFileSync(`${metadatadir}/metadata.json`, JSON.stringify(data, null, 2), {encoding: 'utf8'})

}
