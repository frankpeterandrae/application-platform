#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = process.cwd();
const IGNORED = new Set(['node_modules', '.git', 'coverage', 'dist']);

function walk(dir, results = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const e of entries) {
		if (IGNORED.has(e.name)) continue;
		const full = path.join(dir, e.name);
		if (e.isDirectory()) {
			walk(full, results);
		} else if (e.isFile() && e.name === 'project.json') {
			results.push(full);
		}
	}
	return results;
}

function toPosix(p) {
	return p.split(path.sep).join('/');
}

function computeReportsDirectory(projectDir, projectName) {
	// projectDir is absolute path to project folder
	const rel = path.relative(projectDir, workspaceRoot); // how to go from projectDir to workspaceRoot
	// Count depth from workspace root to projectDir
	const projectRootRel = path.relative(workspaceRoot, projectDir);
	const parts = projectRootRel === '' ? [] : toPosix(projectRootRel).split('/');
	const up = parts.length === 0 ? '.' : Array(parts.length).fill('..').join('/');
	const reportsDir = parts.length === 0 ? `coverage/${projectName}` : `${up}/coverage/${toPosix(projectRootRel)}`;
	return reportsDir;
}

const projectJsonFiles = walk(workspaceRoot);
if (projectJsonFiles.length === 0) {
	console.log('No project.json files found.');
	process.exit(0);
}

const updated = [];
for (const file of projectJsonFiles) {
	try {
		const raw = fs.readFileSync(file, 'utf8');
		const json = JSON.parse(raw);
		const targets = json.targets || json.targets;
		if (!targets || !targets.test) continue;
		const executor = (targets.test && targets.test.executor) || '';
		if (!executor || !executor.includes('vitest')) continue;

		const projectDir = path.dirname(file);
		const projectName = json.name || path.basename(projectDir);

		let changed = false;

		// ensure outputs contains {options.reportsDirectory}
		targets.test.outputs = targets.test.outputs || [];
		if (!targets.test.outputs.includes('{options.reportsDirectory}')) {
			targets.test.outputs.push('{options.reportsDirectory}');
			changed = true;
		}

		// ensure options.reportsDirectory exists
		targets.test.options = targets.test.options || {};
		if (!('reportsDirectory' in targets.test.options)) {
			const reportsDirectory = computeReportsDirectory(projectDir, projectName);
			targets.test.options.reportsDirectory = reportsDirectory;
			changed = true;
		}

		if (changed) {
			// write back
			const formatted = JSON.stringify(json, null, 2) + '\n';
			fs.writeFileSync(file, formatted, 'utf8');
			updated.push(file);
			console.log(`Updated: ${toPosix(path.relative(workspaceRoot, file))}`);
		}
	} catch (e) {
		console.error(`Failed to process ${file}: ${e.message}`);
	}
}

console.log('\nSummary:');
if (updated.length === 0) console.log('No changes necessary');
else console.log(`Patched ${updated.length} project.json files.`);

process.exit(0);
