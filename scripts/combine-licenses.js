/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

const fs = require('node:fs');

// Read both JSON files
const licenseCheckerData = JSON.parse(fs.readFileSync('tmp/foss-licenses.json', 'utf-8'));
const fontLicenseData = JSON.parse(fs.readFileSync('licenses/font-licenses.json', 'utf-8'));

// Merge the data
const combinedLicenses = {
	...licenseCheckerData,
	fonts: fontLicenseData.fonts
};

// Ensure the directory exists
fs.mkdirSync('dist/production/assets/licenses', { recursive: true });

// Write the combined JSON to a new file
fs.writeFileSync('dist/production/assets/licenses/foss-licenses.json', JSON.stringify(combinedLicenses, null, 2));
console.log("Combined licenses written to 'dist/production/assets/licenses/foss-licenses.json'");
