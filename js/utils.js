import fs from "fs"


const gsbpm = JSON.parse(fs.readFileSync('./../data/GSBPM_5_1.json', 'utf8'))


// Find a GSBPM phase or sub process name based on its code
function find_gsbpm_name(code) {
	let parts = code.split(".")
	if (parts.length > 0)
		for (const phase of gsbpm.phases) 
			if (parts[0] == phase.phase_code) {
				if (parts.length == 1) return(phase.phase_name)
				for (const sub_process of phase.sub_processes)
					if (code == sub_process.sub_process_code)
						return(sub_process.sub_process_name)
			}
	return("unknown gsbpm")
}


// Tests:
console.log(find_gsbpm_name("1.4")) // "Identify concepts" 
console.log(find_gsbpm_name("1"))   // "Specify Needs"
console.log(find_gsbpm_name(""))   // "unkown gsbpm"
console.log(find_gsbpm_name("1.9"))   // "unkown gsbpm"
console.log(find_gsbpm_name("5.7.9"))   // "unkown gsbpm"
