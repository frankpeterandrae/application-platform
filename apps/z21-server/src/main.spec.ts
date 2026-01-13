/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { loadConfig } from './infra/config/config';

const cfg = loadConfig();
const publicDir = path.resolve(process.cwd(), 'public');
const indexHtmlContent = '<!doctype html><html><body>INDEX</body></html>';
const jsContent = 'console.log("hello");';

async function httpRequest(pathname: string) {
	return new Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }>((resolve, reject) => {
		const req = http.request({ method: 'GET', hostname: '127.0.0.1', port: cfg.httpPort, path: pathname }, (res) => {
			const chunks: Buffer[] = [];
			res.on('data', (c) => chunks.push(c as Buffer));
			res.on('end', () =>
				resolve({ statusCode: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') })
			);
		});
		req.on('error', reject);
		req.end();
	});
}

beforeAll(async () => {
	// Ensure public directory exists and contains predictable files
	fs.mkdirSync(publicDir, { recursive: true });
	fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtmlContent, 'utf8');
	fs.writeFileSync(path.join(publicDir, 'app.js'), jsContent, 'utf8');

	// Import the server module to start the HTTP server

	await import('./main');
});

afterAll(() => {
	// Clean up files we created
	try {
		fs.unlinkSync(path.join(publicDir, 'app.js'));
		fs.unlinkSync(path.join(publicDir, 'index.html'));
		// don't remove the public directory itself in case it contains other project files
	} catch {
		// ignore
	}
});

it('returns index.html for root request', async () => {
	const r = await httpRequest('/');
	expect(r.statusCode).toBe(200);
	expect(String(r.headers['content-type'] || '')).toContain('text/html');
	expect(r.body).toContain('INDEX');
});

it('serves existing javascript file with correct content-type', async () => {
	const r = await httpRequest('/app.js');
	expect(r.statusCode).toBe(200);
	expect(String(r.headers['content-type'] || '')).toContain('application/javascript');
	expect(r.body).toContain('hello');
});

it('falls back to index.html when a requested file is missing', async () => {
	const r = await httpRequest('/does-not-exist');
	expect(r.statusCode).toBe(200);
	expect(String(r.headers['content-type'] || '')).toContain('text/html');
	expect(r.body).toContain('INDEX');
});

it('rejects path traversal attempts outside of public directory', async () => {
	const r = await httpRequest('/../package.json');
	expect(r.statusCode).toBe(403);
});

it('rejects requests containing a null byte in the path', async () => {
	// Use encoded %00 which decodeURIComponent will turn into a null byte
	const r = await httpRequest('/%00');
	expect(r.statusCode).toBe(400);
});
