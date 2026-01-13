/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { type ClientToServer, isClientToServerMessage, PROTOCOL_VERSION, type ServerToClient } from '@application-platform/protocol';
import { Z21Udp } from '@application-platform/z21';
import { WebSocketServer, type WebSocket } from 'ws';

import { loadConfig } from './infra/config/config';

/**
 * Represents the state for a single locomotive in the demo server.
 *
 * - speed: normalized in [0,1] (clamped by clamp01).
 * - dir: direction, either 'FWD' or 'REV'.
 * - fns: map of function number -> boolean (on/off).
 */
type LocoState = {
	speed: number;
	dir: 'FWD' | 'REV';
	fns: Record<number, boolean>;
};

const cfg = loadConfig(); // server configuration (ports, z21 host/port, safety settings)
const udp = new Z21Udp(cfg.z21.host, cfg.z21.udpPort); // helper to send Z21 UDP demo pings

// Serve files from the project's public directory

const publicDir = path.resolve(process.cwd(), 'public');

/**
 * Helper to map file extensions to a content-type header value
 * @param filePath - requested file path
 * @returns content-type string
 */
function getContentType(filePath: string): string {
	if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
	if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
	if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
	if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
	return 'application/octet-stream';
}

/**
 * Serve static files from `publicDir`.
 *
 * - If the requested path resolves outside of `publicDir`, respond with 403 Forbidden.
 * - If the requested file does not exist, fallback to `index.html` (SPA-style).
 * - Sets a simple Content-Type based on file extension for common types.
 *
 * @param req - Incoming HTTP request
 * @param res - HTTP response object
 */
function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): void {
	// Use the raw URL to detect obvious path traversal attempts before URL normalization
	const rawUrl = req.url ?? '/';
	// Reject common path traversal patterns in the raw URL (../ or encoded %2e%2e)
	const lowerRaw = String(rawUrl).toLowerCase();
	if (lowerRaw.includes('..') || lowerRaw.includes('%2e%2e')) {
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}

	const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
	let p = url.pathname;

	// Decode URL-encoded path (ignore malformed sequences)
	try {
		p = decodeURIComponent(p);
	} catch {
		// If decode fails, keep the original path - it will be validated below
	}

	// Reject path traversal path segments like '..' that survive decoding
	const segments = p.split('/');
	if (segments.includes('..')) {
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}

	if (p === '/') {
		p = '/index.html';
	}

	// Reject null bytes early
	if (p.includes('\0')) {
		res.writeHead(400);
		res.end('Bad Request');
		return;
	}

	// Normalize and resolve the requested path against publicDir.
	// Use path.resolve + path.relative to make sure the final path is inside publicDir
	const normalized = path.normalize(p);
	const resolvedPath = path.resolve(publicDir, '.' + normalized);
	const relative = path.relative(publicDir, resolvedPath);

	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		// Attempt to access outside of publicDir -> forbidden
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}

	fs.readFile(resolvedPath, (err, data) => {
		if (err) {
			// Fallback to index.html for SPA or missing file
			fs.readFile(path.join(publicDir, 'index.html'), (e2, d2) => {
				if (e2) {
					res.writeHead(404);
					res.end('Not Found');
					return;
				}
				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				res.end(d2);
			});
			return;
		}

		// Basic content-type sniffing for common types
		const ct = getContentType(resolvedPath);
		res.writeHead(200, { 'Content-Type': ct });
		res.end(data);
	});
}

const server = http.createServer(serveStatic);
const wss = new WebSocketServer({ server });

/**
 * In-memory map of locomotive address => state.
 * Used to keep demo state and broadcast changes to connected clients.
 */
const locos = new Map<number, LocoState>();

/**
 * Send a typed ServerToClient message to a single WebSocket client.
 *
 * @param ws - target WebSocket
 * @param msg - message complying with ServerToClient union/type
 */
function send(ws: WebSocket, msg: ServerToClient): void {
	ws.send(JSON.stringify(msg));
}

/**
 * Broadcast a message to all connected WebSocket clients that are open.
 *
 * @param msg - message to broadcast
 */
function broadcast(msg: ServerToClient): void {
	const s = JSON.stringify(msg);
	for (const client of wss.clients) {
		// readyState === 1 indicates OPEN
		if (client.readyState === 1) {
			client.send(s);
		}
	}
}

/**
 * Handle incoming WebSocket connections:
 * - send initial session.ready message
 * - parse and validate incoming messages
 * - call `handle(...)` to act on accepted messages
 * - on close, optionally stop all locos if safety config enabled
 */
wss.on('connection', (ws) => {
	// Notify client that the session is ready and provide protocol version + server time
	send(ws, { type: 'server.replay.session.ready', protocolVersion: PROTOCOL_VERSION, serverTime: new Date().toISOString() });

	// Handle incoming messages from this client
	ws.on('message', (data) => {
		// eslint-disable-next-line no-console
		console.log('[ws] raw', data.toString());
		let msg: unknown;
		try {
			msg = JSON.parse(data.toString());
		} catch {
			// ignore malformed JSON
			return;
		}
		// Validate the incoming message against ClientToServer union/type
		if (!isClientToServerMessage(msg)) {
			// eslint-disable-next-line no-console
			console.log('[ws] rejected', msg);
			return;
		}

		// eslint-disable-next-line no-console
		console.log('[ws] accepted', msg.type);

		// route/handle validated message
		handle(ws, msg);
	});

	// If configured, stop all locomotives when a client disconnects
	ws.on('close', () => {
		if (cfg.safety.stopAllOnClientDisconnect) {
			for (const [addr, st] of locos.entries()) {
				st.speed = 0;
				broadcast({ type: 'loco.message.state', addr, speed: 0, dir: st.dir, fns: st.fns });
			}
		}
	});
});

/**
 * Process a validated ClientToServer message from a WebSocket client.
 *
 * Side effects:
 * - updates in-memory loco state
 * - sends UDP demo pings (via udp.demoPing) to keep Z21 alive in some environments
 * - broadcasts updated state/messages to all connected clients
 *
 * @param ws - the WebSocket the message came from (not always used)
 * @param msg - validated ClientToServer message
 */
function handle(ws: WebSocket, msg: ClientToServer): void {
	switch (msg.type) {
		case 'server.command.session.hello':
			// ignore for now
			return;

		case 'system.command.trackpower.set':
			// Simulate ping to the Z21 device and broadcast the track power state
			udp.demoPing();
			broadcast({ type: 'system.message.trackpower', on: msg.on, short: false });
			return;

		case 'loco.command.drive': {
			// Ensure we have a state object for the loco, update speed/dir and store
			const st: LocoState = locos.get(msg.addr) ?? { speed: 0, dir: 'FWD', fns: {} as Record<number, boolean> };
			st.speed = clamp01(msg.speed);
			st.dir = msg.dir;
			locos.set(msg.addr, st);

			// Notify the (simulated) Z21 and other clients about the change
			udp.demoPing();
			broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns });
			return;
		}

		case 'loco.command.function.set': {
			// Toggle a function bit for a loco and broadcast the new state
			const st: LocoState = locos.get(msg.addr) ?? { speed: 0, dir: 'FWD', fns: {} as Record<number, boolean> };
			st.fns[msg.fn] = msg.on;
			locos.set(msg.addr, st);

			udp.demoPing();
			broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns });
			return;
		}

		case 'switching.command.turnout.set': {
			// Forward turnout commands to clients and simulate Z21 activity
			udp.demoPing();
			broadcast({ type: 'switching.message.turnout.state', addr: msg.addr, state: msg.state });
			return;
		}
	}
}

/**
 * Clamp a numeric value to the [0, 1] range used for locomotive speeds.
 *
 * - Non-finite numbers return 0.
 * - Values < 0 return 0.
 * - Values > 1 return 1.
 *
 * @param v - input number (expected numeric speed)
 * @returns normalized speed in [0,1]
 */
function clamp01(v: number): number {
	if (!Number.isFinite(v)) return 0;
	if (v < 0) return 0;
	if (v > 1) return 1;
	return v;
}

// Start UDP helper and HTTP/WebSocket server
udp.start();
server.listen(cfg.httpPort, () => {
	// eslint-disable-next-line no-console
	console.log(`[server] http://0.0.0.0:${cfg.httpPort} (Z21 ${cfg.z21.host}:${cfg.z21.udpPort})`);
});
