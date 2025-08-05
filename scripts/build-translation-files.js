const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePaths = process.argv.slice(2); // Get the file paths passed by lint-staged

filePaths.forEach((filePath) => {
	if (path.basename(filePath) === 'de.json') {
		const content = fs.readFileSync(filePath, 'utf8');
		const jsonContent = JSON.parse(content);

		const pathObject = jsonToPathObject(jsonContent);

		const parentDir = path.dirname(filePath);
		const i18nDir = filePath.includes('/apps')
			? path.join(parentDir, '../../../src/app/i18n')
			: path.join(parentDir, '../../../lib/i18n');
		const i18nFilePath = path.join(i18nDir, 'i18n.ts');

		const i18nKey = path.basename(parentDir).replace(/-./g, (match) => match[1].toUpperCase());

		const outputContent = `export const ${i18nKey}TextModules = ${JSON.stringify(pathObject, null, 2)};`;
		fs.mkdirSync(path.dirname(i18nFilePath), { recursive: true });
		fs.writeFileSync(i18nFilePath, outputContent, 'utf8');

		// Format the file using Prettier
		execSync(`npx prettier --write ${i18nFilePath}`);

		// Stage the generated file
		execSync(`git add ${i18nFilePath}`);
	}
});

function jsonToPathObject(obj, currentPath = '') {
	const result = {};
	for (const key in obj) {
		const newPath = currentPath ? `${currentPath}.${key}` : key;
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			result[key] = jsonToPathObject(obj[key], newPath);
		} else {
			result[key] = newPath;
		}
	}
	return result;
}
