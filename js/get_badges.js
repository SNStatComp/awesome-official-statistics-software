"use strict"
const fs = require('fs')
const https = require('https')
const yaml = require('js-yaml')

const badgedir = "../badges"
if (!fs.existsSync(badgedir)) fs.mkdirSync(badgedir)
	
try {
    let fileContents = fs.readFileSync('./../data/software.yaml', 'utf8')
    let data = yaml.load(fileContents)
    process(data)
} catch (e) {
    console.log(e)
}

function process(data) {
	for (const item of data) {
		item.safeName = item.name.replace(/ /g, '_')
		item.badgedir = `${badgedir}/${item.safeName}`
		if (!fs.existsSync(item.badgedir)) fs.mkdirSync(item.badgedir)
		
		const parts = item.url.split("/")
		if (parts[2] === 'cran.r-project.org') {
			const name = parts[3].split('=')[1]
			console.log('Cran: ',name)
			// version:
			download_svg(`https://www.r-pkg.org/badges/version-last-release/${name}`, `${item.badgedir}/version.svg`)
			// downloads:
			download_svg(`https://cranlogs.r-pkg.org/badges/grand-total/${name}`, `${item.badgedir}/downloads.svg`)
		}
		
		if (parts[2] === 'github.com') {
			const user = parts[3], repo = parts[4]
			console.log('GH: ',user,repo)
			// version:
			download_svg(`https://img.shields.io/github/v/tag/${user}/${repo}?style=plastic`, `${item.badgedir}/version.svg`)
			// downloads:
			download_svg(`https://img.shields.io/github/downloads/${user}/${repo}/total?style=plastic`, `${item.badgedir}/downloads.svg`)
		}
	}
}	

function download_svg(url, path) {
	https.get(url, (res) => {
	  const writeStream = fs.createWriteStream(path)
	  res.pipe(writeStream)
	  writeStream.on("finish", () => writeStream.close())
	})
}