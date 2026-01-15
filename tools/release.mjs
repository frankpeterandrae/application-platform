/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

run('nx build z21-ui');
run('nx build z21-server');

// Safely remove existing release directory (Windows-friendly)
try {
	fs.rmSync(path.resolve('release'), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch (err) {
	// If deletion fails due to EPERM or locked files, log and continue with fresh creation
	console.warn(`[release] Warning: failed to remove release directory: ${err?.code ?? err}`);
}
fs.mkdirSync(path.resolve('release/public'), { recursive: true });
fs.mkdirSync(path.resolve('release/server'), { recursive: true });

const uiOut = fs.existsSync('dist/apps/z21-ui/browser') ? 'dist/apps/z21-ui/browser' : 'dist/apps/z21-ui';

copyDir(path.resolve(uiOut), path.resolve('release/public'));
copyDir(path.resolve('dist/apps/z21-server'), path.resolve('release/server'));
copyFileIfExists('apps/z21-server/config.json', 'release/config.json');

console.log('✅ release/ ready');

function copyFileIfExists(src, dest) {
	if (fs.existsSync(src)) {
		fs.copyFileSync(src, dest);
	}
}

function copyDir(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}
