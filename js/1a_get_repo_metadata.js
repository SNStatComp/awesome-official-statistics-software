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
const GITLAB_API_TOKEN = process.env.GITLAB_API_TOKEN
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
		const metadataIsFresh = !options.force && is_metadata_complete(item, item.metadatadir)
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
					const languages = select_languages(res_lang?.data || {})

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
				pendingOperations.push((async () => {
					try {
						const projectParts = new URL(item.url).pathname.split('/').filter(Boolean).map(decodeURIComponent)
						if (projectParts.length < 2) throw new Error('Expected a namespace and project in the GitLab URL')
						projectParts[projectParts.length - 1] = projectParts[projectParts.length - 1].replace(/\.git$/i, '')
						if (!projectParts[projectParts.length - 1]) throw new Error('Expected a project in the GitLab URL')
						const project = projectParts.join('/')
						const apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(project)}`
						const metadata = await gitlab_request(`${apiUrl}?license=true`)
						const languages = await gitlab_request(`${apiUrl}/languages`)
						fs.writeFileSync(path.join(item.metadatadir, 'pkg_gl.json'), JSON.stringify(metadata), 'utf8')
						fs.writeFileSync(path.join(item.metadatadir, 'pkg_gl_languages.json'), JSON.stringify(languages), 'utf8')
						write_pkg_json(item.metadatadir, {
							name: item.name,
							platform: 'GitLab',
							license: item?.license || metadata.license?.spdx_identifier || metadata.license?.key || 'unknown',
							languages: item?.languages || select_languages(languages)
						}, generatedAt)
					} catch (error) {
						console.error(`Error reading GitLab metadata for ${item.name}: ${error.message}`)
						process.exitCode = 1
					}
				})())

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

function is_metadata_complete(item, directory) {
	if (!is_metadata_fresh(path.join(directory, 'pkg.json'))) return false
	if (itemType(item.url) === 'GL') {
		return ['pkg_gl.json', 'pkg_gl_languages.json']
			.every((filename) => fs.existsSync(path.join(directory, filename)))
	}
	if (itemType(item.url) !== 'GH') return true

	const pathParts = new URL(item.url).pathname.split('/').filter(Boolean)
	if (pathParts.length < 2) return true

	return ['pkg_gh.json', 'pkg_gh_languages.json']
		.every((filename) => fs.existsSync(path.join(directory, filename)))
}

function select_languages(languages) {
	const total = Object.values(languages).reduce((sum, value) => sum + value, 0)
	return Object.keys(languages).filter((language) =>
		!languageFilter.includes(language) && languages[language] > total * 0.2)
}

async function gitlab_request(url) {
	const response = await fetch(url, {
		headers: GITLAB_API_TOKEN ? { 'PRIVATE-TOKEN': GITLAB_API_TOKEN } : {}
	})
	if (!response.ok) throw new Error(`GitLab API request failed (HTTP ${response.status} ${response.statusText}) for ${url}`)
	const data = await response.json()
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw new Error(`Invalid GitLab API response for ${url}`)
	}
	if (url.endsWith('/languages') && Object.values(data).some((value) =>
		typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
		throw new Error(`Invalid GitLab language data for ${url}`)
	}
	return data
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