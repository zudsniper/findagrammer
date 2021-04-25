const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { log } = Apify.utils;

const nameGenderObj = [];
fs.createReadStream(path.join(__dirname, 'resources', 'name_gender.csv'))
	.pipe(csv())
	.on('data', (data) => nameGenderObj.push(data))
	.on('end', () => {
		log.debug("loaded gender by name csv");
	});

function guessGenderFromName(name) {
	let cName = capitalize(name);
	for(let entry of nameGenderObj) { //could be made more efficient b/c csv is in alphabetical order by name
		//console.log('in entry with name: ' + entry['name']);
		if(entry['name'] === cName) {
			return entry['gender'];
		}
	}
	return null;
}

function capitalize(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

