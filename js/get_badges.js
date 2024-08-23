"use strict"
import fs from "fs"
import https from 'https'
import yaml from "js-yaml"

const badgedir = "../badges2"
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
		item.badgedir = `${badgedir}/${item.name}`
		if (!fs.existsSync(item.badgedir)) fs.mkdirSync(item.badgedir)
		
		const parts = item.url.split("/")
		switch(parts[2]) {
			case 'cran.r-project.org': {
				const name = parts[3].split('=')[1]
				console.log('Cran: ',name)
				// version and latest:
				download_svg(`https://www.r-pkg.org/badges/version-ago/${name}`, `${item.badgedir}/version.svg`)
				// latest:
				none_svg(`${item.badgedir}/latest.svg`)
				// license
				download_svg(`https://img.shields.io/cran/l/${name}?&style=plastic`, `${item.badgedir}/license.svg`)
				break
			}
			case 'github.com': {
				const user = parts[3], repo = parts[4]
				console.log('GH: ',user,repo)
				// version:
				download_svg(`https://img.shields.io/github/v/release/${user}/${repo}?display_name=tag&label=GitHub&include_prereleases&style=plastic`, `${item.badgedir}/version.svg`)
				// latest:
				download_svg(`https://img.shields.io/github/last-commit/${user}/${repo}?style=plastic`, `${item.badgedir}/latest.svg`)
				// license:
				download_svg(`https://img.shields.io/github/license/${user}/${repo}?style=plastic`, `${item.badgedir}/license.svg`)
				break
			}
			case 'gitlab.com': {
				let project = parts[3]
				for (let i=4; i<parts.length; i++) project += "/"+parts[i]
				console.log('GL: ',project)
				// version:
				download_svg(`https://img.shields.io/gitlab/v/release/${project}?include_prereleases&sort=semver&label=GitLab&style=plastic`, `${item.badgedir}/version.svg`)
				console.log(`https://img.shields.io/gitlab/v/release/${project}?include_prereleases&sort=semver&label=GitLab&style=plastic`)
				// latest:
				download_svg(`https://img.shields.io/gitlab/last-commit/${project}?gitlab_url=https%3A%2F%2Fgitlab.com&style=plastic`, `${item.badgedir}/latest.svg`)
				console.log(`https://img.shields.io/gitlab/last-commit/${project}?gitlab_url=https%3A%2F%2Fgitlab.com&style=plastic`)
				// license:
				download_svg(`https://img.shields.io/gitlab/license/${project}?style=plastic`, `${item.badgedir}/license.svg`)
				break
			}
			case 'pypi.org': {
				const name = parts[4]
				console.log('PYPI: ',name)
				// version:
				download_svg(`https://img.shields.io/pypi/v/${name}?label=PyPI&style=plastic`, `${item.badgedir}/version.svg`)
				// latest:
				none_svg(`${item.badgedir}/latest.svg`)
				// license:
				download_svg(`https://img.shields.io/pypi/l/${name}?&style=plastic`, `${item.badgedir}/license.svg`)
				break
			}
			case 'www.npmjs.com': {
				const name = parts[4]
				console.log('NPM: ',name)
				// version:
				download_svg(`https://img.shields.io/npm/v/${name}?style=plastic`, `${item.badgedir}/version.svg`)
				// latest:
				none_svg(`${item.badgedir}/latest.svg`)
				// license:
				download_svg(`https://img.shields.io/npm/l/${name}?&style=plastic`, `${item.badgedir}/license.svg`)
				break
			}
			default: {
				console.log('default: ', item.url)
				download_svg(`https://img.shields.io/static/v1?label=other&message=${item.name}&color=blue?&style=plastic`, `${item.badgedir}/version.svg`)
				none_svg(`${item.badgedir}/latest.svg`)
				none_svg(`${item.badgedir}/license.svg`)
			}
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
function none_svg(path) {
	fs.writeFile(path, `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`, (err) => {
		if (err) throw err;
	})
}