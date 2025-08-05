const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = process.cwd();
let filePaths = process.argv.slice(2); // Get the file paths passed by lint-staged or CLI

// If no paths provided, find all de.json files under apps/ and libs/
if (filePaths.length === 0) {
	filePaths = findAllDeJsonFiles();
	if (filePaths.length === 0) {
		console.log('No de.json files found in apps/ or libs/. Nothing to do.');
		process.exit(0);
	}
}

filePaths.forEach((rawPath) => {
	const filePath = path.normalize(rawPath);
	if (path.basename(filePath) === 'de.json') {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const jsonContent = JSON.parse(content);

			const pathObject = jsonToPathObject(jsonContent);

			const parentDir = path.dirname(filePath);

			// Determine project root by walking up until a folder that contains a 'src' directory
			const projectRoot = findProjectRootWithSrc(parentDir) || repoRoot;

			// Decide output i18n directory depending on whether path is under apps or libs
			let i18nDir;
			if (filePath.split(path.sep).includes('apps')) {
				i18nDir = path.join(projectRoot, 'src', 'app', 'i18n');
			} else {
				// default for libraries
				i18nDir = path.join(projectRoot, 'src', 'lib', 'i18n');
			}

			const i18nFilePath = path.join(i18nDir, 'i18n.ts');

			// Build key name from the parent directory of the JSON (camelCase)
			const i18nKey = path.basename(parentDir).replace(/-./g, (match) => match[1].toUpperCase());

			const outputContent = `export const ${i18nKey}TextModules = ${JSON.stringify(pathObject, null, 2)};`;
			fs.mkdirSync(path.dirname(i18nFilePath), { recursive: true });
			fs.writeFileSync(i18nFilePath, outputContent, 'utf8');

			// Format the file using Prettier (if available)
			try {
				execSync(`npx prettier --write "${i18nFilePath}"`, { stdio: 'ignore' });
			} catch (err) {
				console.warn('Prettier formatting failed or is not available:', err.message);
			}

			// Stage the generated file (if inside a git repo)
			try {
				execSync(`git add "${i18nFilePath}"`, { stdio: 'ignore' });
			} catch (err) {
				// ignore git failures (e.g., not a git repo)
			}

			console.log(`Generated: ${i18nFilePath}`);
		} catch (err) {
			console.error(`Failed processing ${filePath}:`, err);
		}
	}
});

function jsonToPathObject(obj, currentPath = '') {
	const result = {};
	for (const key in obj) {
		if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
		const newPath = currentPath ? `${currentPath}.${key}` : key;
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			result[key] = jsonToPathObject(obj[key], newPath);
		} else {
			result[key] = newPath;
		}
	}
	return result;
}

function findAllDeJsonFiles() {
	const results = [];
	const roots = ['apps', 'libs'].map((p) => path.join(repoRoot, p)).filter((p) => fs.existsSync(p));
	for (const root of roots) {
		walkDir(root, (file) => {
			if (path.basename(file).toLowerCase() === 'de.json') results.push(file);
		});
	}
	return results;
}

function walkDir(dir, cb) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			// skip node_modules and .git for performance
			if (entry.name === 'node_modules' || entry.name === '.git') continue;
			walkDir(full, cb);
		} else if (entry.isFile()) {
			cb(full);
		}
	}
}

function findProjectRootWithSrc(startDir) {
	let dir = path.resolve(startDir);
	const root = path.parse(dir).root;
	while (true) {
		if (fs.existsSync(path.join(dir, 'src'))) return dir;
		if (dir === root) return null;
		dir = path.dirname(dir);
	}
}
