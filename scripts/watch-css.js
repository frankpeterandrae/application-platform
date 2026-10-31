/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

const sass = require('sass');

const fs = require('node:fs').promises;
const path = require('node:path');

// Keep Angular Devkit's Chokidar 5 peer separate from this watcher.
const chokidar = require('chokidar-watcher');

const themePath = path.join(__dirname, '../libs/shared/ui-theme/src/lib/theme');
const cssOutputPath = path.join(themePath, 'styles.css');
let timer;
let compilation;
let pending = false;
let stopping = false;
let shutdown;

const watcher = chokidar.watch(themePath, {
	persistent: true,
	ignoreInitial: true,
	ignored: (filePath, stats) => stats?.isFile() && !filePath.endsWith('.scss')
});

async function compileSass() {
	const result = await sass.compileAsync(path.join(themePath, 'styles.scss'), { style: 'compressed' });
	const css = result.css.replaceAll(/\/\*!.*?Frank-Peter Andrä.*?\*\//gs, '');
	await fs.writeFile(cssOutputPath, css);
	console.log(`CSS successfully compiled to ${cssOutputPath}`);
}

function stop() {
	if (!shutdown) {
		stopping = true;
		clearTimeout(timer);
		shutdown = Promise.all([watcher.close(), compilation]).then(() => {
			console.log('CSS watcher stopped.');
		});
	}
	return shutdown;
}

function fail(error) {
	console.error('CSS watcher error:', error);
	process.exitCode = 1;
	void stop().catch((closeError) => console.error('CSS watcher shutdown error:', closeError));
}

function rebuild() {
	if (stopping || compilation) return;
	compilation = (async () => {
		do {
			pending = false;
			await compileSass();
		} while (pending && !stopping);
	})();
	void compilation.then(
		() => {
			compilation = undefined;
		},
		(error) => {
			compilation = undefined;
			fail(error);
		}
	);
}

for (const event of ['add', 'change', 'unlink']) {
	watcher.on(event, (filePath) => {
		if (stopping || !filePath.endsWith('.scss')) return;
		console.log(`SCSS ${event}: ${filePath}`);
		pending = true;
		clearTimeout(timer);
		timer = setTimeout(rebuild, 100);
	});
}

// Compile after the initial scan so edits during compilation cannot be missed.
watcher.on('ready', rebuild).on('error', fail);
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => void stop().catch(fail));
}
