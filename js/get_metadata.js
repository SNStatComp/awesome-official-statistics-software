"use strict"
import fs from "fs"
import https from 'https'
import path from "path"
import { fileURLToPath } from "url"
import yaml from "js-yaml"
import { Octokit } from "octokit";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const dataFile = path.resolve(scriptDirectory, "../data/software.yaml")
const metadatadir = path.resolve(scriptDirectory, "../metadata")
const GH_API_TOKEN = process.env.GH_API_TOKEN
const pendingOperations = []
let githubRateLimitReached = false
const octokit = new Octokit({
	...(GH_API_TOKEN ? { auth: GH_API_TOKEN } : {}),
	throttle: {
		onRateLimit: stopGithubRequests,
		onSecondaryRateLimit: stopGithubRequests
	}
})

const languageFilter = ['Makefile', 'TeX', 'HTML'] // do not mention these as programming languages
const supportedTypes = new Set(['GH', 'CRAN', 'PYPI', 'GL'])

function stopGithubRequests() {
	githubRateLimitReached = true
	return false
}

function maskToken(token) {
	if (!token) return 'not set'
	if (token.length <= 8) return 'set (masked)'
	return `set (${token.slice(0, 4)}...${token.slice(-4)})`
}

try {
	const options = parseArguments(process.argv.slice(2))
	if (options.help) {
		console.log('Usage: node get_metadata.js [options]')
		console.log('Options:')
		console.log('  --max N        Process at most N items')
		console.log('  --type TYPE    Process only GH, CRAN, PYPI, or GL items')
		console.log('  --name ITEM    Process only the item with this exact name')
		console.log('  --help, -h     Show this help')
		console.log('Options may be used alone or together, in any order.')
		console.log('Example: node get_metadata.js --type CRAN --max 10')
	} else {
		console.log(`GH_API_TOKEN: ${maskToken(GH_API_TOKEN)}`)
		if (!fs.existsSync(metadatadir)) fs.mkdirSync(metadatadir, { recursive: true })
		const fileContents = fs.readFileSync(dataFile, 'utf8')
		const data = yaml.load(fileContents)
		if (!Array.isArray(data)) throw new Error(`${dataFile} must contain a YAML array`)
		const selectedData = selectItems(data, options)
		console.log(`Total items to process: ${selectedData.length}`)
		await process_data(selectedData)
	}
} catch (e) {
	console.error(e)
	process.exitCode = 1
}

function parseArguments(argumentsList) {
	if (argumentsList.length === 1 && ['--help', '-h'].includes(argumentsList[0])) {
		return { help: true }
	}

	let maximumItems
	let type
	let itemName
	const setOption = (option, value) => {
		if (option === 'max') {
			if (maximumItems !== undefined) throw new Error('Maximum items can only be specified once')
			maximumItems = Number(value)
			if (!/^\d+$/.test(value) || !Number.isSafeInteger(maximumItems)) {
				throw new Error('Maximum items must be a non-negative integer')
			}
			return
		}
		if (option === 'type') {
			if (type !== undefined) throw new Error('Item type can only be specified once')
			type = value.toUpperCase()
			if (!supportedTypes.has(type)) throw new Error('Type must be one of: GH, CRAN, PYPI, GL')
			return
		}
		if (option === 'name') {
			if (itemName !== undefined) throw new Error('Item name can only be specified once')
			if (!value) throw new Error('Item name cannot be empty')
			itemName = value
		}
	}

	for (let index = 0; index < argumentsList.length; index++) {
		const argument = argumentsList[index]
		if (!argument.startsWith('--')) {
			throw new Error('Usage: node get_metadata.js [--max N] [--type GH|CRAN|PYPI|GL] [--name ITEM] [--help]')
		}

		const separator = argument.indexOf('=')
		const option = argument.slice(2, separator === -1 ? undefined : separator)
		if (!['max', 'type', 'name'].includes(option)) {
			throw new Error('Usage: node get_metadata.js [--max N] [--type GH|CRAN|PYPI|GL] [--name ITEM] [--help]')
		}
		const value = separator === -1 ? argumentsList[++index] : argument.slice(separator + 1)
		if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for --${option}`)
		setOption(option, value)
	}

	return { maximumItems, type, itemName }
}

function selectItems(data, options) {
	let filteredData = options.type
		? data.filter((item) => itemType(item.url) === options.type)
		: data
	if (options.itemName !== undefined) {
		filteredData = filteredData.filter((item) => item.name === options.itemName)
	}
	return options.maximumItems === undefined
		? filteredData
		: filteredData.slice(0, options.maximumItems)
}

function itemType(itemUrl) {
	const hostname = new URL(itemUrl).hostname.toLowerCase()
	if (hostname === 'github.com') return 'GH'
	if (hostname === 'cran.r-project.org') return 'CRAN'
	if (hostname === 'pypi.org') return 'PYPI'
	if (hostname === 'gitlab.com') return 'GL'
	return undefined
}

async function process_data(data) {
	for (const [index, item] of data.entries()) {
		if (!item || !item.name || !item.url) throw new Error('Every software entry must have a name and URL')
		pendingOperations.length = 0
		item.metadatadir = `${metadatadir}/${item.name}`
		if (!fs.existsSync(item.metadatadir)) fs.mkdirSync(item.metadatadir, { recursive: true })
		const metadataIsFresh = is_metadata_fresh(path.join(item.metadatadir, 'pkg.json'))
		const generatedAt = new Date().toISOString()
		
		const parts = item.url.split("/")
		console.log(`[${index + 1}/${data.length}] ${itemType(item.url) || 'other'}: ${item.name}${metadataIsFresh ? ' (metadata cached)' : ''}`)
		if (metadataIsFresh) continue

		switch(parts[2]) {
			case 'cran.r-project.org': {
				const name = parts[3].split('=')[1]

                // badges:
				download_svg(`https://www.r-pkg.org/badges/version-ago/${name}`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/cran/l/${name}?&style=plastic`, `${item.metadatadir}/license.svg`)

                // pkg metadata:
				try {
					const operation = fetch(`https://crandb.r-pkg.org/${name}`)
						.then((response) => {
							if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
							return response.json()
						})
						.then((pkg_cran) => {
							fs.writeFileSync(`${item.metadatadir}/pkg_cran.json`, JSON.stringify(pkg_cran), 'utf8')
							write_pkg_json(item.metadatadir, {
								name: item.name,
								platform: 'CRAN',
								license: item?.license || pkg_cran?.License || "unknown",
								languages: ['R']	// note: we ignore that some parts might be written in C/C++ as this is not visible to a package user
							}, generatedAt)
					})
					pendingOperations.push(operation.catch((error) => {
						console.error(`Error reading CRAN metadata for ${name}:`, error.message)
					}))
				} catch (error) {
					console.error(`Error starting CRAN metadata request for ${name}:`, error.message)
				}

				break
			}
			case 'github.com': {
				const user = parts[3], repo = parts[4]
				
				// If GitHub organization, only one github badge for now: 
				if (parts.length == 4) {
					download_svg(`https://img.shields.io/badge/GitHub-organization-blue&style=plastic`, `${item.metadatadir}/version.svg`)
					none_svg(`${item.metadatadir}/latest.svg`)
					none_svg(`${item.metadatadir}/license.svg`)
					write_pkg_json(item.metadatadir, {
						name: item.name,
						platform: 'GitHub',
						license: item?.license || 'unknown',
						languages: item?.languages || 'unknown'
					}, generatedAt)
					break
				}

				// badges:
				download_svg(`https://img.shields.io/github/v/release/${user}/${repo}?display_name=tag&label=GitHub&include_prereleases&style=plastic`, `${item.metadatadir}/version.svg`)
				download_svg(`https://img.shields.io/github/last-commit/${user}/${repo}?style=plastic`, `${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/github/license/${user}/${repo}?style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata:
				pendingOperations.push((async () => {
					const res_meta = await GH_meta(user, repo)
					const res_lang = githubRateLimitReached ? null : await GH_languages(user, repo)

					//pkg meta
					fs.writeFileSync(`${item.metadatadir}/pkg_gh.json`, JSON.stringify(res_meta), 'utf8')

					// pkg languages
					fs.writeFileSync(`${item.metadatadir}/pkg_gh_languages.json`, JSON.stringify(res_lang), 'utf8')
					// calculate languages above threshold:
					let arr = res_lang?.data || []
					let total = 0; for (const l in arr) {total += arr[l]}
					let languages=[]; for (const l in arr) if (languageFilter.indexOf(l) == -1 && arr[l] > total*0.2) languages.push(l)

					// write selected info to pkg.json
					write_pkg_json(item.metadatadir, {
						name: item.name,
						platform: 'GitHub',
						license: item?.license || res_meta?.data?.license?.spdx_id || 'unknown',
						languages: languages
					}, generatedAt)
				})())

                break
			}
			case 'gitlab.com': {
				let project = parts[3]
				for (let i=4; i<parts.length; i++) project += "/"+parts[i]

				// badges:
				download_svg(`https://img.shields.io/gitlab/v/release/${project}?include_prereleases&sort=semver&label=GitLab&style=plastic`, `${item.metadatadir}/version.svg`)
				download_svg(`https://img.shields.io/gitlab/last-commit/${project}?gitlab_url=https%3A%2F%2Fgitlab.com&style=plastic`, `${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/gitlab/license/${project}?style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata, only from config:
				write_pkg_json(item.metadatadir, {
					name: item.name,
					platform: 'GitLab',
					license: item?.license || 'unknown',
					languages: item?.languages || 'unknown'
				}, generatedAt)

                break
			}
			case 'pypi.org': {
				const name = parts[4]
				
                // badges:
				download_svg(`https://img.shields.io/pypi/v/${name}?label=PyPI&style=plastic`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/pypi/l/${name}?&style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata, only from config:
				write_pkg_json(item.metadatadir, {
					name: item.name,
					platform: 'PyPI',
					license: item?.license || 'unknown',
					languages: ['Python']
				}, generatedAt)

                break
			}
			case 'www.npmjs.com': {
				const name = parts[4]
				
                // badges:
				download_svg(`https://img.shields.io/npm/v/${name}?style=plastic`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				download_svg(`https://img.shields.io/npm/l/${name}?&style=plastic`, `${item.metadatadir}/license.svg`)
				
				// pkg metadata, only from config:
				write_pkg_json(item.metadatadir, {
					name: item.name,
					platform: 'npm',
					license: item?.license || 'unknown',
					languages: ['JavaScript']
				}, generatedAt)

                break
			}
			default: {
				
                // badges:
                download_svg(`https://img.shields.io/static/v1?label=other&message=${item.name}&color=blue?&style=plastic`, `${item.metadatadir}/version.svg`)
				none_svg(`${item.metadatadir}/latest.svg`)
				none_svg(`${item.metadatadir}/license.svg`)

                // pkg metadata, only from config:
				write_pkg_json(item.metadatadir, {
					name: item.name,
					platform: 'other',
					license: item?.license || 'unknown',
					languages: ['unknown']
				}, generatedAt)

                break
			}
		}
		await Promise.all(pendingOperations)
		if (index < data.length - 1) await wait(2000)
	}
}	

function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function write_pkg_json(directory, metadata, generatedAt) {
	fs.writeFileSync(path.join(directory, 'pkg.json'), JSON.stringify({
		...metadata,
		generatedAt
	}), 'utf8')
}

function is_metadata_fresh(pkgFile) {
	try {
		const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
		const generatedAt = Date.parse(pkg.generatedAt)
		const age = Date.now() - generatedAt
		return Number.isFinite(generatedAt) && age >= 0 && age < 7 * 24 * 60 * 60 * 1000
	} catch {
		return false
	}
}

function download_svg(url, path) {
	const operation = new Promise((resolve, reject) => {
		https.get(url, (res) => {
			if (res.statusCode < 200 || res.statusCode >= 300) {
				res.resume()
				reject(new Error(`HTTP ${res.statusCode}`))
				return
			}
			const writeStream = fs.createWriteStream(path)
			res.pipe(writeStream)
			writeStream.on("finish", () => writeStream.close(resolve))
			writeStream.on("error", reject)
		}).on("error", reject)
	})
	const trackedOperation = operation.catch((error) => {
		console.error(`Error downloading badge ${url}:`, error.message)
		return fs.promises.writeFile(path, '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
	})
	pendingOperations.push(trackedOperation)
	return trackedOperation
}
function none_svg(path) {
	try {
		fs.writeFileSync(path, `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`)
	} catch (error) {
		console.error('error writing :', path)
	}
}
async function GH_meta(owner, repo) {
	return github_request('GET /repos/{owner}/{repo}', owner, repo)
}
async function GH_languages(owner, repo) {
	return github_request('GET /repos/{owner}/{repo}/languages', owner, repo)
}

async function github_request(route, owner, repo) {
	if (githubRateLimitReached) return null

	try {
		const response = await octokit.request(route, {
			owner: owner,
			repo: repo,
			headers: {
				'X-GitHub-Api-Version': '2026-03-10'
			}
		})
		if (get_header(response.headers, 'x-ratelimit-remaining') === '0') {
			githubRateLimitReached = true
			console.error('GitHub API rate limit reached. Skipping further GitHub API requests.')
		}
		return response
	} catch (error) {
		const status = error.status || error.response?.status || 'unknown status'
		const message = error.response?.data?.message || error.message || 'unknown error'
		const headers = error.response?.headers || error.headers
		const remaining = get_header(headers, 'x-ratelimit-remaining')
		const rateLimited = status === 429 || remaining === '0' ||
			(status === 403 && /rate limit|secondary rate limit/i.test(message))
		if (rateLimited) {
			githubRateLimitReached = true
		}
		const resetAt = get_header(headers, 'x-ratelimit-reset')
		const resetMessage = resetAt
			? ` Rate limit reset: ${new Date(Number(resetAt) * 1000).toISOString()}.`
			: ''
		const rateLimitMessage = rateLimited ? ' Skipping further GitHub API requests.' : ''
		console.error(`GitHub API request failed (${status}) for ${owner}/${repo} [${route}]: ${message}.${resetMessage}${rateLimitMessage}`)
		return null
	}
}

function get_header(headers, name) {
	if (!headers) return undefined
	if (typeof headers.get === 'function') return headers.get(name)
	return headers[name] || headers[name.toLowerCase()]
}