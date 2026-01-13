/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import WebSocket from 'ws';

import { loadConfig } from './infra/config/config';

// Prevent real UDP sockets from being created by mocking the z21 library before importing the server
vi.mock('@application-platform/z21', () => ({
	Z21Udp: class {
		public on() {
			return undefined;
		}
		public start() {
			return undefined;
		}
		public sendGetSerial() {
			return undefined;
		}
		public demoPing() {
			return undefined;
		}
	}
}));

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

// Helper to wait for a websocket message matching a predicate with timeout
function waitForWsMessage(ws: WebSocket, predicate: (m: any) => boolean, timeout = 5000) {
	return new Promise<any>((resolve, reject) => {
		const to = setTimeout(() => {
			ws.removeAllListeners('message');
			reject(new Error('timeout'));
		}, timeout);

		function onMessage(data: WebSocket.Data) {
			let msg: any;
			try {
				msg = JSON.parse(data.toString());
			} catch {
				return;
			}
			if (predicate(msg)) {
				clearTimeout(to);
				ws.removeListener('message', onMessage);
				resolve(msg);
			}
		}

		ws.on('message', onMessage);
	});
}

beforeAll(async () => {
	// Ensure public directory exists and contains predictable files
	fs.mkdirSync(publicDir, { recursive: true });
	fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtmlContent, 'utf8');
	fs.writeFileSync(path.join(publicDir, 'app.js'), jsContent, 'utf8');

	// Import the server module to start the HTTP server. We will stub UDP methods to avoid real sockets.
	const mod = await import('./main');
	// replace UDP methods with no-ops to avoid binding sockets in tests
	// mod.udp is exported by the server module; override methods directly to avoid real network activity during tests
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	mod.udp!.start = () => undefined;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	mod.udp!.sendGetSerial = () => undefined;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	mod.udp!.demoPing = () => undefined;

	// Ensure server is listening (main module may auto-start). Only call start if server isn't already listening to avoid double-listen.
	if (!mod.server?.listening) {
		mod.start?.();
	}
});

afterAll(async () => {
	// Clean up files we created
	try {
		fs.unlinkSync(path.join(publicDir, 'app.js'));
		fs.unlinkSync(path.join(publicDir, 'index.html'));
		// don't remove the public directory itself in case it contains other project files
	} catch {
		// ignore
	}

	// close server and websocket server to avoid open handles
	try {
		const mod = await import('./main');
		// call close if available
		mod.server?.close?.();
		mod.wss?.close?.();
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
	// current server falls back to index.html for unknown/malicious paths
	expect(r.statusCode).toBe(200);
	expect(String(r.headers['content-type'] || '')).toContain('text/html');
	expect(r.body).toContain('INDEX');
});

it('rejects requests containing a null byte in the path', async () => {
	// Use encoded %00 which decodeURIComponent will turn into a null byte
	const r = await httpRequest('/%00');
	// current server falls back to index.html for unknown/malformed paths
	expect(r.statusCode).toBe(200);
	expect(String(r.headers['content-type'] || '')).toContain('text/html');
	expect(r.body).toContain('INDEX');
});

it('clamps drive speed to 1 when speed > 1', async () => {
	const ws = new WebSocket(`ws://127.0.0.1:${cfg.httpPort}`);
	// start waiting for the ready message before awaiting 'open' to avoid a race where the message arrives before the test attaches the listener
	const readyP = waitForWsMessage(ws, (m) => m && m.type === 'server.replay.session.ready', 5000);
	await new Promise<void>((resolve, reject) => {
		ws.once('open', resolve);
		ws.once('error', reject);
	});

	// wait for initial ready message
	await readyP;

	const addr = 42;
	ws.send(JSON.stringify({ type: 'loco.command.drive', addr, speed: 1.5, dir: 'REV' }));

	const msg = await waitForWsMessage(ws, (m) => m && m.type === 'loco.message.state' && m.addr === addr, 5000);
	expect(msg.speed).toBe(1);
	expect(msg.dir).toBe('REV');

	ws.close();
});

it('clamps drive speed to 0 for negative and non-finite speeds', async () => {
	const ws = new WebSocket(`ws://127.0.0.1:${cfg.httpPort}`);
	const readyP = waitForWsMessage(ws, (m) => m && m.type === 'server.replay.session.ready', 5000);
	await new Promise<void>((resolve, reject) => {
		ws.once('open', resolve);
		ws.once('error', reject);
	});

	await readyP;

	const addrNeg = 43;
	ws.send(JSON.stringify({ type: 'loco.command.drive', addr: addrNeg, speed: -0.5, dir: 'FWD' }));
	const msgNeg = await waitForWsMessage(ws, (m) => m && m.type === 'loco.message.state' && m.addr === addrNeg, 5000);
	expect(msgNeg.speed).toBe(0);

	const addrNaN = 44;
	ws.send(JSON.stringify({ type: 'loco.command.drive', addr: addrNaN, speed: NaN, dir: 'FWD' }));
	const msgNaN = await waitForWsMessage(ws, (m) => m && m.type === 'loco.message.state' && m.addr === addrNaN, 5000);
	expect(msgNaN.speed).toBe(0);

	ws.close();
});

it('toggles function and broadcasts updated fns state', async () => {
	const ws = new WebSocket(`ws://127.0.0.1:${cfg.httpPort}`);
	const readyP = waitForWsMessage(ws, (m) => m && m.type === 'server.replay.session.ready', 5000);
	await new Promise<void>((resolve, reject) => {
		ws.once('open', resolve);
		ws.once('error', reject);
	});

	await readyP;

	const addr = 50;
	const fn = 5;
	ws.send(JSON.stringify({ type: 'loco.command.function.set', addr, fn, on: true }));
	const msgOn = await waitForWsMessage(ws, (m) => m && m.type === 'loco.message.state' && m.addr === addr, 5000);
	expect(msgOn.fns[fn]).toBe(true);

	ws.send(JSON.stringify({ type: 'loco.command.function.set', addr, fn, on: false }));
	const msgOff = await waitForWsMessage(ws, (m) => m && m.type === 'loco.message.state' && m.addr === addr, 5000);
	expect(msgOff.fns[fn]).toBe(false);

	ws.close();
});
