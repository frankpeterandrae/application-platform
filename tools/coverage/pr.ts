/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { execFile, spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { promisify } from 'node:util';

import { createCoverageReport, loadCoverage, writeCoverageReport, writeMergedLcov } from './coverage-utils';

const execFileAsync = promisify(execFile);

async function main(): Promise<void> {
	const base = process.argv[2] ?? 'origin/main';
	const mergeBase = await getMergeBase(base);

	await rm('test-result', { recursive: true, force: true });

	console.log(`Running affected tests against ${base} (merge base ${mergeBase})...`);

	await run('npx', ['nx', 'affected', '--target=test', `--base=${mergeBase}`, '--head=HEAD', '--configuration=ci', '--skip-nx-cache']);

	const coverage = await loadCoverage();
	const changedLines = await getChangedLines(base);
	const report = createCoverageReport(coverage, changedLines);

	const [reportFile, lcovFile] = await Promise.all([
		writeCoverageReport(report, 'coverage-pr.json', {
			base,
			head: 'HEAD'
		}),
		writeMergedLcov(coverage)
	]);

	console.log(`PR coverage against ${base} contains ${report.files.length} file(s).`);
	console.log(`Written to ${reportFile}`);
	console.log(`Merged LCOV written to ${lcovFile}`);
}

async function getChangedLines(base: string): Promise<Map<string, Set<number>>> {
	const { stdout } = await execFileAsync('git', [
		'diff',
		'--unified=0',
		'--no-color',
		'--diff-filter=ACMRT',
		`${base}...HEAD`,
		'--',
		'apps',
		'libs'
	]);

	const changed = new Map<string, Set<number>>();
	let currentFile: string | undefined;

	for (const line of stdout.split(/\r?\n/)) {
		if (line.startsWith('+++ b/')) {
			currentFile = line.slice(6).replaceAll('\\', '/');

			if (!changed.has(currentFile)) {
				changed.set(currentFile, new Set());
			}

			continue;
		}

		if (!currentFile || !line.startsWith('@@')) {
			continue;
		}

		const match = /\+(\d+)(?:,(\d+))?/.exec(line);

		if (!match) {
			continue;
		}

		const start = Number(match[1]);
		const count = match[2] === undefined ? 1 : Number(match[2]);
		const lines = changed.get(currentFile);

		for (let offset = 0; offset < count; offset++) {
			lines?.add(start + offset);
		}
	}

	return changed;
}

async function getMergeBase(base: string): Promise<string> {
	const { stdout } = await execFileAsync('git', ['merge-base', base, 'HEAD']);

	return stdout.trim();
}

async function run(command: string, args: string[]): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: 'inherit',
			shell: process.platform === 'win32'
		});

		child.on('error', reject);
		child.on('exit', (code) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(new Error(`${command} exited with code ${code ?? 'unknown'}.`));
		});
	});
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
