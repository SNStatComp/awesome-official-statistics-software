"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import * as yaml from "js-yaml"
import { Octokit } from "octokit";
import { is_metadata_fresh, itemType, parseArguments, selectItems, showHelp, wait } from "./utils.js"

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
		showHelp()
	} else {
		console.log(`GH_API_TOKEN: ${maskToken(GH_API_TOKEN)}`)
		if (!fs.existsSync(metadatadir)) fs.mkdirSync(metadatadir, { recursive: true })
		const fileContents = fs.readFileSync(dataFile, 'utf8')
		const data = yaml.load(fileContents)
		if (!Array.isArray(data)) throw new Error(`${dataFile} must contain a YAML array`)
		const selectedData = selectItems(data, options)
		console.log(`Total items to process: ${selectedData.length}`)
		await process_data(selectedData, options)
	}
} catch (e) {
	console.error(e)
	process.exitCode = 1
}

async function process_data(data, options) {
	for (const [index, item] of data.entries()) {
		if (!item || !item.name || !item.url) throw new Error('Every software entry must have a name and URL')
		pendingOperations.length = 0
		item.metadatadir = `${metadatadir}/${item.name}`
		if (!fs.existsSync(item.metadatadir)) fs.mkdirSync(item.metadatadir, { recursive: true })
		const metadataIsFresh = !options.force && is_metadata_fresh(path.join(item.metadatadir, 'pkg.json'))
		const generatedAt = new Date().toISOString()
		
		const parts = item.url.split("/")
		console.log(`[${index + 1}/${data.length}] ${itemType(item.url) || 'other'}: ${item.name}${metadataIsFresh ? ' (from cache)' : ''}`)
		if (metadataIsFresh) continue

		switch(parts[2]) {
			case 'cran.r-project.org': {
				const name = parts[3].split('=')[1]

				// pkg metadata:
				try {
					const operation = fetch(`https://crandb.r-pkg.org/${name}`)
						.then((response) => {
							if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
							return response.json()
						})
						.then(async (pkg_cran) => {
							fs.writeFileSync(`${item.metadatadir}/pkg_cran.json`, JSON.stringify(pkg_cran), 'utf8')
							write_pkg_json(item.metadatadir, {
								name: item.name,
								platform: 'CRAN',
								license: item?.license || pkg_cran?.License || "unknown",
								languages: ['R']	// note: we ignore that some parts might be written in C/C++ as this is not visible to a package user
							}, generatedAt)

							const githubRepos = get_github_repos(pkg_cran?.URL)
							for (const [repoIndex, { owner, repo }] of githubRepos.entries()) {
								const res_meta = await GH_meta(owner, repo)
								const res_lang = githubRateLimitReached ? null : await GH_languages(owner, repo)
								const suffix = repoIndex === 0
									? ''
									: `_${`${owner}_${repo}`.replace(/[^a-zA-Z0-9._-]/g, '_')}`
								fs.writeFileSync(path.join(item.metadatadir, `pkg_gh${suffix}.json`), JSON.stringify(res_meta), 'utf8')
								fs.writeFileSync(path.join(item.metadatadir, `pkg_gh${suffix}_languages.json`), JSON.stringify(res_lang), 'utf8')
							}
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
					write_pkg_json(item.metadatadir, {
						name: item.name,
						platform: 'GitHub',
						license: item?.license || 'unknown',
						languages: item?.languages || 'unknown'
					}, generatedAt)
					break
				}

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

function write_pkg_json(directory, metadata, generatedAt) {
	fs.writeFileSync(path.join(directory, 'pkg.json'), JSON.stringify({
		...metadata,
		generatedAt
	}), 'utf8')
}

function get_github_repos(urls) {
	const entries = Array.isArray(urls) ? urls : typeof urls === 'string' ? [urls] : []
	const repos = new Map()
	for (const entry of entries.flatMap((value) => typeof value === 'string' ? value.split(/[\s,]+/) : [])) {
		try {
			const url = new URL(entry)
			if (url.hostname.toLowerCase() !== 'github.com') continue
			const [owner, repository] = url.pathname.split('/').filter(Boolean)
			if (!owner || !repository) continue
			const repo = repository.replace(/\.git$/i, '')
			repos.set(`${owner}/${repo}`.toLowerCase(), { owner, repo })
		} catch {
			continue
		}
	}
	return [...repos.values()]
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