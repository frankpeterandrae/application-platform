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

type WsMessage = { type: string; payload: { [key: string]: unknown } };

export type E2eCtx = {
	proc: ChildProcessWithoutNullStreams;
	logs: string[];
	ws?: WebSocket;
	messages?: WsMessage[];
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

// Helper: normalize WebSocket message data into a UTF-8 string reliably
function wsDataToString(data: unknown): string | undefined {
	if (typeof data === 'string') return data;
	if (Buffer.isBuffer(data)) {
		return data.toString('utf8');
	}
	if (data instanceof ArrayBuffer) {
		return Buffer.from(new Uint8Array(data)).toString('utf8');
	}
	if (Array.isArray(data)) {
		const parts: Buffer[] = [];
		for (const p of data) {
			if (Buffer.isBuffer(p)) {
				parts.push(p);
			} else if (typeof p === 'string') {
				parts.push(Buffer.from(p));
			}
		}
		if (parts.length) return Buffer.concat(parts).toString('utf8');
	}
	return undefined;
}

export function mkTmpConfig(httpPort: number, fakeZ21Port: number, listenPort?: number): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z21-e2e-'));
	const cfgPath = path.join(dir, 'config.json');

	const cfg: { httpPort: number; z21: Record<string, unknown>; safety: { stopAllOnClientDisconnect: boolean } } = {
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
		stdio: ['pipe', 'pipe', 'pipe']
	});

	proc.stdout.on('data', (d) => logs.push(d.toString()));
	proc.stderr.on('data', (d) => logs.push(d.toString()));

	await waitFor(() => (logs.join('').includes('server.started') ? true : undefined), { label: 'server.started', timeoutMs: 12000 });

	const messages: WsMessage[] = [];

	// Retry loop für WS connect
	const ws = await (async () => {
		const start = Date.now();
		while (Date.now() - start < 12000) {
			const candidate = new WebSocket(`ws://127.0.0.1:${httpPort}`);

			candidate.on('message', (data) => {
				const s = wsDataToString(data);
				if (!s) return;
				try {
					messages.push(JSON.parse(s));
				} catch {
					// ignore
				}
			});

			try {
				await new Promise<void>((resolve, reject) => {
					candidate.once('open', resolve);
					candidate.once('error', reject);
				});
				return candidate;
			} catch {
				try {
					candidate.close();
				} catch {
					// ignore
				}
				await delay(50);
			}
		}
		throw new Error(`timeout (ws connect) ws://127.0.0.1:${httpPort}`);
	})();

	await waitFor(() => messages.find((m) => m?.type === 'server.replay.session.ready'), {
		label: 'server.replay.session.ready',
		timeoutMs: 12000,
		dump: () => `\nWS:\n${messages.map((m) => JSON.stringify(m)).join('\n')}\n\nLOGS:\n${logs.join('')}`
	});

	return { proc, logs, ws, messages, httpPort, fakeZ21Port };
}

export async function stopCtx(ctx: E2eCtx): Promise<void> {
	if (ctx.ws) {
		ctx.ws.close();
	}
	ctx.proc.kill('SIGTERM');
	if (ctx.ws && ctx.ws.readyState === WebSocket.OPEN) {
		const ws = ctx.ws; // ensure stable reference without non-null assertions
		await new Promise<void>((resolve) => {
			ws?.once('close', () => resolve());
			ws?.close();
			// fallback, falls close nie kommt
			setTimeout(resolve, 500).unref?.();
		});
	}

	await new Promise<void>((resolve) => {
		ctx.proc.once('exit', () => resolve());
		ctx.proc.kill('SIGTERM');
		// fallback: hart killen, falls er hängt
		setTimeout(() => {
			try {
				ctx.proc.kill('SIGKILL');
			} catch {
				// ignore
			}
			resolve();
		}, 1500).unref?.();
	});
}

export async function sendUdpHex(hex: string, port = 21105): Promise<void> {
	const frame = Buffer.from(hex, 'hex');
	const udp = dgram.createSocket('udp4');
	await new Promise<void>((resolve, reject) => {
		udp.send(frame, port, '127.0.0.1', (err) => (err ? reject(err) : resolve()));
	});
	udp.close();
}

export async function waitForWsType<T = unknown>(ctx: E2eCtx, type: string, timeoutMs = 4000): Promise<T> {
	return (await waitFor(() => ctx.messages?.find((m) => m?.type === type), {
		label: `ws ${type}`,
		timeoutMs,
		dump: () => `\nWS:\n${ctx.messages?.map((m) => JSON.stringify(m)).join('\n')}`
	})) as T;
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

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startServer(): Promise<E2eCtx> {
	const httpPort = 18000 + Math.floor(Math.random() * 1000);
	const fakeZ21Port = 20000 + Math.floor(Math.random() * 1000);

	const cfgPath = mkTmpConfig(httpPort, fakeZ21Port);

	const serverPath = path.join(process.cwd(), 'dist/apps/z21-server/main.js');
	if (!fs.existsSync(serverPath)) {
		throw new Error(`Server build output not found: ${serverPath}\nRun: nx build server`);
	}

	const logs: string[] = [];
	const proc = spawn('node', [serverPath], {
		env: {
			...process.env,
			Z21_CONFIG: cfgPath,
			// wichtig: e2e soll silent/clean sein
			LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'silent',
			WS_HEARTBEAT_MS: '200'
		}
	});

	proc.stdout.on('data', (d) => {
		const s = d.toString();
		logs.push(s);
		if (process.env['E2E_DEBUG'] === '1') {
			console.log('[server]', s.trimEnd());
		}
	});
	proc.stderr.on('data', (d) => {
		const s = d.toString();
		logs.push(s);
		if (process.env['E2E_DEBUG'] === '1') {
			console.error('[server]', s.trimEnd());
		}
	});

	// Wait until server reports it has started (NO WS connect here!)
	await waitFor(() => (logs.join('').includes('server.started') ? true : undefined), {
		label: 'server.started',
		timeoutMs: 12000,
		dump: () => `\nLOGS:\n${logs.join('')}`
	});

	return { proc, logs, httpPort, fakeZ21Port };
}

export async function connectWs(httpPort: number): Promise<{ ws: WebSocket; messages: WsMessage[] }> {
	const url = `ws://127.0.0.1:${httpPort}`;
	const ws = new WebSocket(url);

	await new Promise<void>((resolve, reject) => {
		ws.once('open', resolve);
		ws.once('error', reject);
	});

	const messages: WsMessage[] = [];
	ws.on('message', (data) => {
		const s = wsDataToString(data);
		if (!s) return;
		try {
			messages.push(JSON.parse(s));
		} catch {
			// ignore non-json
		}
	});

	return { ws, messages };
}
