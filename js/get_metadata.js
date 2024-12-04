"use strict"
import fs from "fs"
import https from 'https'
import yaml from "js-yaml"
import { Octokit, App } from "octokit";

let GH_API_TOKEN = process.env.GH_API_TOKEN  // in shell: export GH_API_TOKEN=<token>
console.log(GH_API_TOKEN.length)
const octokit = new Octokit({ auth: GH_API_TOKEN })

const languageFilter = ['Makefile', 'TeX', 'HTML'] // do not mention these as programming languages

const metadatadir = "../metadata"
if (!fs.existsSync(metadatadir)) fs.mkdirSync(metadatadir)
	
try {
    let fileContents = fs.readFileSync('./../data/software.yaml', 'utf8')
    let data = yaml.load(fileContents)
    process_data(data)
} catch (e) {
    console.log(e)
}

function process_data(data) {
	for (const item of data) {
		item.metadatadir = `${metadatadir}/${item.name}`
		if (!fs.existsSync(item.metadatadir)) fs.mkdirSync(item.metadatadir)
		
		const parts = item.url.split("/")
		switch(parts[2]) {
			case 'cran.r-project.org': {
				const name = parts[3].split('=')[1]
				console.log('Cran: ',name)

                // badges:
				download_svg(`https://www.r-pkg.org/badges/version-ago/${name}`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/cran/l/${name}?&style=plastic`, `${item.metadatadir}/license.svg`)

                // pkg metadata:
				fetch(`https://crandb.r-pkg.org/${name}`)
					.then((response) => response.json())
					.then((pkg_cran) => {
						fs.writeFileSync(`${item.metadatadir}/pkg_cran.json`, JSON.stringify(pkg_cran), 'utf8')
						fs.writeFileSync(`${item.metadatadir}/pkg.json`, JSON.stringify({
							name: item.name,
							platform: 'CRAN',
							license: item?.license || pkg_cran?.License || "unknown",
							languages: ['R']	// note: we ignore that some parts might be written in C/C++ as this is not visible to a package user
						}), 'utf8')
				})

				break
			}
			case 'github.com': {
				// TODO: handle github organisations: parts.length == 4
				// Then: no regular badges, only github badge and metadata that is derivable 

				const user = parts[3], repo = parts[4]
				console.log('GH: ',user,repo)

				// badges:
				download_svg(`https://img.shields.io/github/v/release/${user}/${repo}?display_name=tag&label=GitHub&include_prereleases&style=plastic`, `${item.metadatadir}/version.svg`)
				download_svg(`https://img.shields.io/github/last-commit/${user}/${repo}?style=plastic`, `${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/github/license/${user}/${repo}?style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata:
				let p1 = GH_meta(user, repo)
				let p2 = GH_languages(user, repo)
				Promise.all([p1, p2]).then(([res_meta, res_lang]) => {
					//pkg meta
					fs.writeFileSync(`${item.metadatadir}/pkg_gh.json`, JSON.stringify(res_meta), 'utf8')

					// pkg languages
					fs.writeFileSync(`${item.metadatadir}/pkg_gh_languages.json`, JSON.stringify(res_lang), 'utf8')
					// calculate languages above threshold:
					let arr = res_lang?.data || []
					let total = 0; for (const l in arr) {total += arr[l]}
					let languages=[]; for (const l in arr) if (languageFilter.indexOf(l) == -1 && arr[l] > total*0.2) languages.push(l)

					// write selected info to pkg.json
					fs.writeFileSync(`${item.metadatadir}/pkg.json`, JSON.stringify({
						name: item.name,
						platform: 'GitHub',
						license: item?.license || res_meta?.data?.license?.spdx_id || 'unknown',
						languages: languages
					}), 'utf8')

				})

                break
			}
			case 'gitlab.com': {
				let project = parts[3]
				for (let i=4; i<parts.length; i++) project += "/"+parts[i]
				console.log('GL: ',project)

				// badges:
				download_svg(`https://img.shields.io/gitlab/v/release/${project}?include_prereleases&sort=semver&label=GitLab&style=plastic`, `${item.metadatadir}/version.svg`)
				download_svg(`https://img.shields.io/gitlab/last-commit/${project}?gitlab_url=https%3A%2F%2Fgitlab.com&style=plastic`, `${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/gitlab/license/${project}?style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata, only from config:
				fs.writeFileSync(`${item.metadatadir}/pkg.json`, JSON.stringify({
					name: item.name,
					platform: 'GitLab',
					license: item?.license || 'unknown',
					languages: item?.languages || 'unknown'
				}), 'utf8')

                break
			}
			case 'pypi.org': {
				const name = parts[4]
				console.log('PYPI: ',name)
				
                // badges:
				download_svg(`https://img.shields.io/pypi/v/${name}?label=PyPI&style=plastic`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/pypi/l/${name}?&style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata, only from config:
				fs.writeFileSync(`${item.metadatadir}/pkg.json`, JSON.stringify({
					name: item.name,
					platform: 'PyPI',
					license: item?.license || 'unknown',
					languages: ['Python']
				}), 'utf8')

                break
			}
			case 'www.npmjs.com': {
				const name = parts[4]
				console.log('NPM: ',name)
				
                // badges:
				download_svg(`https://img.shields.io/npm/v/${name}?style=plastic`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/npm/l/${name}?&style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata, only from config:
				fs.writeFileSync(`${item.metadatadir}/pkg.json`, JSON.stringify({
					name: item.name,
					platform: 'npm',
					license: item?.license || 'unknown',
					languages: ['JavaScript']
				}), 'utf8')

                break
			}
			default: {
				console.log('default: ', item.url)
				
                // badges:
                download_svg(`https://img.shields.io/static/v1?label=other&message=${item.name}&color=blue?&style=plastic`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				none_svg(`${item.metadatadir}/license.svg`)

                // pkg metadata, only from config:
				fs.writeFileSync(`${item.metadatadir}/pkg.json`, JSON.stringify({
					name: item.name,
					platform: 'other',
					license: item?.license || 'unknown',
					languages: ['unknown']
				}), 'utf8')

                break
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
	try {
		fs.writeFileSync(path, `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`)
	} catch (error) {
		console.error('error writing :', path)
	}
}
async function GH_meta(owner, repo) {
	try {
		let res = await octokit.request('GET /repos/{owner}/{repo}', {
			owner: owner,
			repo: repo,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		return(res)
	} catch(error) {
		return(null)
	}
}
async function GH_languages(owner, repo) {
	try {
		let res = await octokit.request('GET /repos/{owner}/{repo}/languages', {
			owner: owner,
			repo: repo,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		return(res)
	} catch (error) {
		return(null)
	}
}