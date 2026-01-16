/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ChildProcess } from 'node:child_process';
import { execSync, spawn } from 'node:child_process';
import * as dgram from 'node:dgram';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import WebSocket from 'ws';

export type E2eCtx = {
	proc: ChildProcess;
	logs: string[];
	ws: WebSocket;
	messages: any[];
	httpPort: number;
	fakeZ21Port: number;
};

export function waitFor<T>(
	fn: () => T | undefined,
	opts: { timeoutMs?: number; stepMs?: number; label?: string; dump?: () => string } = {}
): Promise<T> {
	// default timeout shortened to 12s to fail fast during local iteration
	const { timeoutMs = 12000, stepMs = 20, label = 'waitFor', dump } = opts;
	const start = Date.now();
	return new Promise<T>((resolve, reject) => {
		const t = setInterval(() => {
			const v = fn();
			if (v !== undefined) {
				clearInterval(t);
				resolve(v);
				return;
			}
			if (Date.now() - start > timeoutMs) {
				clearInterval(t);
				reject(new Error(`timeout (${label})\n${dump ? dump() : ''}`));
			}
		}, stepMs);
	});
}

export function mkTmpConfig(httpPort: number, fakeZ21Port: number, listenPort?: number): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z21-e2e-'));
	const cfgPath = path.join(dir, 'config.json');

	const cfg: any = {
		httpPort,
		z21: { host: '127.0.0.1', udpPort: fakeZ21Port, ...(listenPort ? { listenPort } : {}) },
		safety: { stopAllOnClientDisconnect: false }
	};

	fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf-8');
	return cfgPath;
}

export async function startServerAndConnectWs(): Promise<E2eCtx> {
	const httpPort = 18000 + Math.floor(Math.random() * 1000);
	const fakeZ21Port = 20000 + Math.floor(Math.random() * 1000);

	const cfgPath = mkTmpConfig(httpPort, fakeZ21Port);

	const candidates = [path.join(process.cwd(), 'dist/apps/z21-server/main.js'), path.join(process.cwd(), 'dist/apps/server/main.js')];

	let serverPath = candidates.find((p) => fs.existsSync(p));
	if (!serverPath) {
		// try to build on-demand (skip cache so artifact is written)
		try {
			console.log('[e2e-helper] server build not found; running: npx nx build z21-server --skip-nx-cache');
			execSync('npx nx build z21-server --skip-nx-cache', { stdio: 'inherit' });
		} catch (err) {
			// ignore, we'll error below if not produced
		}
		serverPath = candidates.find((p) => fs.existsSync(p));
	}
	if (!serverPath) {
		throw new Error(`Server build output not found; tried:\n${candidates.join('\n')}\nRun: nx build z21-server`);
	}

	const logs: string[] = [];
	const proc = spawn('node', [serverPath], {
		env: { ...process.env, Z21_CONFIG: cfgPath },
		stdio: ['ignore', 'pipe', 'pipe']
	});

	proc.stdout.on('data', (d) => {
		const s = d.toString();
		logs.push(s);
		console.log('[server]', s.trimEnd());
	});
	proc.stderr.on('data', (d) => {
		const s = d.toString();
		logs.push(s);
		console.error('[server]', s.trimEnd());
	});

	// wait for server to report HTTP bind in logs
	await waitFor(() => logs.find((l) => l.includes('[server] http://0.0.0.0:')), {
		label: 'server boot',
		dump: () => `\nLOGS:\n${logs.join('')}`
	});

	// pick the actual port logged by the server (fallback to requested httpPort)
	const bootLog = logs.find((l) => l.includes('[server] http://0.0.0.0:')) || '';
	const m = (bootLog as string).match(/http:\/\/0\.0\.0\.0:(\d+)/);
	const actualHttpPort = m ? Number(m[1]) : httpPort;
	console.log(`[e2e-helper] connecting WS to ${actualHttpPort} (requested ${httpPort})`);

	const ws = new WebSocket(`ws://127.0.0.1:${actualHttpPort}`);
	const messages: any[] = [];

	ws.on('message', (data) => {
		const s = data.toString();
		console.log('[ws] rx', s);
		try {
			messages.push(JSON.parse(s));
		} catch {
			// ignore non-json
		}
	});

	await new Promise<void>((resolve, reject) => {
		ws.once('open', () => resolve());
		ws.once('error', reject);
	});

	// wait for session.ready (increase to 10s temporarily for stable local debug)
	await waitFor(
		() =>
			messages.find((m) => {
				const t = typeof m?.type === 'string' ? m.type : undefined;
				return t === 'session.ready' || (t ? t.endsWith('.session.ready') : false);
			}),
		{ label: 'session.ready', timeoutMs: 10000 }
	);

	return { proc, logs, ws, messages, httpPort, fakeZ21Port };
}

export async function stopCtx(ctx: E2eCtx): Promise<void> {
	try {
		ctx.ws.close();
	} catch {
		// ignore
	}
	try {
		ctx.proc.kill('SIGTERM');
	} catch {
		// ignore
	}
}

export async function sendUdpHex(hex: string, port = 21105): Promise<void> {
	const frame = Buffer.from(hex, 'hex');
	const udp = dgram.createSocket('udp4');
	await new Promise<void>((resolve, reject) => {
		udp.send(frame, port, '127.0.0.1', (err) => (err ? reject(err) : resolve()));
	});
	udp.close();
}

export async function waitForWsType<T = any>(ctx: E2eCtx, type: string, timeoutMs = 4000): Promise<T> {
	return waitFor(() => ctx.messages.find((m) => m?.type === type), {
		label: `ws ${type}`,
		timeoutMs,
		dump: () => `\nWS:\n${ctx.messages.map((m) => JSON.stringify(m)).join('\n')}`
	}) as Promise<T>;
}

export type FakeZ21 = {
	port: number;
	rx: Buffer[];
	close: () => Promise<void>;
};

export async function startFakeZ21(port: number): Promise<FakeZ21> {
	const rx: Buffer[] = [];
	const sock = dgram.createSocket('udp4');
	sock.on('message', (msg) => rx.push(Buffer.from(msg)));

	await new Promise<void>((resolve) => sock.bind(port, '127.0.0.1', resolve));

	return {
		port,
		rx,
		close: () =>
			new Promise<void>((resolve) => {
				sock.close(() => resolve());
			})
	};
}
