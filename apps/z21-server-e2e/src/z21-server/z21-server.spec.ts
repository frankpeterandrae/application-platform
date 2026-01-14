/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/// <reference types="vitest" />
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('CLI tests', () => {
	it('should print a message', () => {
		const candidates = [
			join(process.cwd(), 'dist', 'apps', 'z21-server', 'main.js'),
			join(process.cwd(), '..', 'dist', 'apps', 'z21-server', 'main.js'),
			join(__dirname, '..', '..', '..', '..', 'dist', 'apps', 'z21-server', 'main.js'),
			join(__dirname, '..', '..', '..', 'dist', 'apps', 'z21-server', 'main.js')
		];

		const cliPath = candidates.find((p) => existsSync(p));

		if (!cliPath) {
			throw new Error(
				`Could not find built CLI at any of the candidate paths: ${candidates.join(', ')}. Ensure the z21-server build produced dist/apps/z21-server/main.js before running tests.`
			);
		}

		const output = execSync(`node ${cliPath}`).toString();

		expect(output).toMatch(/Hello World/);
	});
});
