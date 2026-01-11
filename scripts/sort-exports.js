/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

const fs = require('fs');
const path = require('node:path');

const filePaths = process.argv.slice(2); // Get the file paths passed by lint-staged

filePaths.forEach((filePath) => {
	if (path.basename(filePath) === 'index.ts') {
		const content = fs.readFileSync(filePath, 'utf8');
		const exportLines = content.split('\n').filter((line) => line.startsWith('export'));

		// Sort the export lines
		const sortedExports = exportLines.sort((a, b) => a.localeCompare(b));

		// Replace the export lines in the file
		const newContent = content
			.split('\n')
			.filter((line) => !line.startsWith('export'))
			.concat(sortedExports)
			.join('\n');

		fs.writeFileSync(filePath, newContent, 'utf8');
	}
});
