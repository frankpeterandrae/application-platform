/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

const fs = require('fs').promises;
const path = require('path');

const argv = process.argv.slice(2);
const FIX = argv.includes('--fix');
const FIX_ADD = argv.includes('--fix-add');
const ROOT = process.cwd();

async function findVitestConfigs(dir) {
	const results = [];
	async function walk(cwd) {
		const entries = await fs.readdir(cwd, { withFileTypes: true });
		for (const e of entries) {
			const full = path.join(cwd, e.name);
			if (e.isDirectory()) {
				if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'release') continue;
				await walk(full);
			} else if (e.isFile() && e.name === 'vitest.config.mts') {
				results.push(full);
			}
		}
	}
	await walk(dir);
	return results.sort();
}

function toPosix(p) {
	return p.split(path.sep).join('/');
}

function desiredPathsFor(filePath) {
	const dir = path.dirname(filePath);
	let rel = path.relative(ROOT, dir);
	if (!rel || rel === '.') rel = '';
	const relPosix = rel ? toPosix(rel) : '';
	const cacheBase = 'node_modules/.vite';
	const outBase = 'test-result';
	const cache = relPosix ? `${cacheBase}/${relPosix}` : cacheBase;
	// outputFile should point to an HTML file inside the test-result directory
	const out = relPosix ? `${outBase}/${relPosix}/index.html` : `${outBase}/index.html`;
	return { cache, out, relPosix };
}

async function processFile(file) {
	const content = await fs.readFile(file, 'utf8');
	const { cache, out, relPosix } = desiredPathsFor(file);

	const cacheRegex = /(cacheDir\s*:\s*resolve\(\s*process\.cwd\(\)\s*,\s*['\"])([^'\"]+)(['\"]\s*\))/;
	const outRegex = /(outputFile\s*:\s*resolve\(\s*process\.cwd\(\)\s*,\s*['\"])([^'\"]+)(['\"]\s*\))/;

	const hasCache = cacheRegex.test(content);
	const hasOut = outRegex.test(content);

	let modified = content;
	const report = { file, rel: relPosix || '.', hasCache, hasOut, cacheMatches: null, outMatches: null, changed: false };

	if (hasCache) {
		modified = modified.replace(cacheRegex, (m, p1, p2, p3) => {
			const matches = p2 === cache;
			report.cacheMatches = matches;
			if (!matches && FIX) {
				report.changed = true;
				return p1 + cache + p3;
			}
			return m;
		});
	} else {
		report.cacheMatches = false;
		if (FIX && FIX_ADD) {
			// insert after the opening object of defineConfig
			const defineRegex = /export\s+default\s+defineConfig\s*\(\s*\{/;
			const m = defineRegex.exec(modified);
			if (m) {
				const insertAt = m.index + m[0].length;
				const insertText = `\n\tcacheDir: resolve(process.cwd(), '${cache}'),`;
				modified = modified.slice(0, insertAt) + insertText + modified.slice(insertAt);
				report.changed = true;
				report.hasCache = true;
				report.cacheMatches = true;
			}
		}
	}

	if (hasOut) {
		modified = modified.replace(outRegex, (m, p1, p2, p3) => {
			const matches = p2 === out;
			report.outMatches = matches;
			if (!matches && FIX) {
				report.changed = true;
				return p1 + out + p3;
			}
			return m;
		});
	} else {
		report.outMatches = false;
		if (FIX && FIX_ADD) {
			// try to insert inside test: { ... }
			const testRegex = /(test\s*:\s*\{)/;
			const m = testRegex.exec(modified);
			if (m) {
				const testStart = m.index + m[0].length;
				// insert as first property inside test
				const insertText = `\n\t\toutputFile: resolve(process.cwd(), '${out}'),`;
				modified = modified.slice(0, testStart) + insertText + modified.slice(testStart);
				report.changed = true;
				report.hasOut = true;
				report.outMatches = true;
			}
		}
	}

	if (report.changed && FIX) {
		await fs.writeFile(file, modified, 'utf8');
	}

	return report;
}

(async function main() {
	try {
		const files = await findVitestConfigs(ROOT);
		if (files.length === 0) {
			console.log('No vitest.config.mts files found.');
			return;
		}

		const reports = [];
		for (const f of files) {
			const r = await processFile(f);
			reports.push(r);
		}

		// Summary
		console.log('Validation summary:');
		for (const r of reports) {
			const parts = [];
			parts.push(r.file.replace(ROOT + path.sep, ''));
			parts.push(`rel='${r.rel}'`);
			parts.push(`cache:${r.hasCache ? (r.cacheMatches ? 'OK' : 'MISMATCH') : 'MISSING'}`);
			parts.push(`output:${r.hasOut ? (r.outMatches ? 'OK' : 'MISMATCH') : 'MISSING'}`);
			if (r.changed) parts.push('(changed)');
			console.log(' -', parts.join(' | '));
		}

		console.log('\nOptions used:');
		console.log(' --fix  ', FIX ? 'ENABLED' : 'disabled (dry-run)');
		console.log(' --fix-add', FIX_ADD ? 'ENABLED' : 'disabled (do not add missing entries)');

		if (!FIX) {
			console.log('\nRun with --fix to apply the suggested replacements.');
			console.log('Run with --fix --fix-add to also insert missing entries when possible.');
		} else {
			console.log('\nFiles were updated where replacements/inserts were possible.');
		}
	} catch (err) {
		console.error('Error:', err);
		process.exitCode = 2;
	}
})();
