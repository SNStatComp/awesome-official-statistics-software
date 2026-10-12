"use strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import * as yaml from "js-yaml"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const dataFile = path.resolve(scriptDirectory, "../data/software.yaml")
const metadatadir = path.resolve(scriptDirectory, "../metadata")

try {
    const fileContents = fs.readFileSync(dataFile, "utf8")
    const data = yaml.load(fileContents)
    if (!Array.isArray(data)) throw new Error(`${dataFile} must contain a YAML array`)
    const mergedData = process_data(data)
    fs.writeFileSync(path.join(metadatadir, "metadata.json"), JSON.stringify(mergedData, null, 2), "utf8")
} catch (e) {
    console.error(e)
    process.exitCode = 1
}

function process_data(data) {
    return data.map((item) => {
        let pkg = {}
        const pkgFile = path.join(metadatadir, item.name, "pkg.json")
        try {
            pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"))
        } catch (error) {
            console.warn(`Unable to read package metadata for ${item.name}: ${error.message}`)
        }

        const mergedItem = { ...item, ...pkg }
        const githubMetadata = read_json_if_exists(path.join(metadatadir, item.name, "pkg_gh.json"))
        const githubLanguages = read_json_if_exists(path.join(metadatadir, item.name, "pkg_gh_languages.json"))
        if (githubMetadata !== undefined) mergedItem.pkg_gh = githubMetadata
        if (githubLanguages !== undefined) mergedItem.pkg_gh_languages = githubLanguages
        const license = typeof mergedItem.license === "string" ? mergedItem.license : ""
        return {
            ...mergedItem,
            licenseSimple: license ? license.split(/[_ -]/)[0] : "unknown"
        }
    })
}

function read_json_if_exists(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"))
    } catch (error) {
        if (error.code !== "ENOENT") console.warn(`Unable to read ${filePath}: ${error.message}`)
        return undefined
    }
}
