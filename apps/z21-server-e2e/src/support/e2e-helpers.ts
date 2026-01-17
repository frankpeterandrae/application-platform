/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import * as dgram from 'node:dgram';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import WebSocket from 'ws';

export type E2eCtx = {
	proc: ChildProcessWithoutNullStreams;
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

	const serverPath = path.join(process.cwd(), 'dist/apps/z21-server/main.js');
	if (!fs.existsSync(serverPath)) {
		throw new Error(`Server build output not found: ${serverPath}\nRun: nx build z21-server`);
	}

	const logs: string[] = [];
	const proc = spawn('node', [serverPath], {
		env: {
			...process.env,
			Z21_CONFIG: cfgPath,
			LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'silent',
			LOG_PRETTY: process.env['LOG_PRETTY'] ?? '0'
		},
		// use 'pipe' for stdin so the ChildProcess type has non-null stdin (ChildProcessWithoutNullStreams)
		stdio: ['pipe', 'pipe', 'pipe']
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

	await waitFor(
		() => {
			const candidate = new WebSocket(`ws://127.0.0.1:${httpPort}`);
			candidate.on('message', (data) => {
				try {
					messages.push(JSON.parse(data.toString()));
				} catch {
					/* ignore */
				}
			});
			return new Promise<WebSocket | undefined>((resolve) => {
				candidate.once('open', () => resolve(candidate));
				candidate.once('error', () => {
					try {
						candidate.close();
					} catch {
						// ignore
					}
					resolve(undefined);
				});
			});
		},
		{ label: 'ws connect', timeoutMs: 12000 }
	);

	// 2) WS verbinden
	const ws = await connectWsWithRetry(`ws://127.0.0.1:${httpPort}`, 12000);
	const messages: any[] = [];

	ws.on('message', (data) => {
		const s = data.toString();
		try {
			messages.push(JSON.parse(s));
		} catch {
			// ignore
		}
	});
	await waitFor(() => messages.find((m) => m?.type === 'server.replay.session.ready'), {
		label: 'server.replay.session.ready',
		timeoutMs: 4000
	});

	return { proc, logs, ws, messages, httpPort, fakeZ21Port };
}

async function connectWsWithRetry(url: string, timeoutMs = 12000): Promise<WebSocket> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const ws = new WebSocket(url);
			await new Promise<void>((resolve, reject) => {
				ws.once('open', resolve);
				ws.once('error', reject);
			});
			return ws;
		} catch {
			await new Promise((r) => setTimeout(r, 50));
		}
	}
	throw new Error(`timeout (ws connect) ${url}`);
}

export async function stopCtx(ctx: E2eCtx): Promise<void> {
	ctx.ws.close();
	ctx.proc.kill('SIGTERM');
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
