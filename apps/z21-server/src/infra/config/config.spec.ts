/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { afterAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { loadConfig } from './config';

vi.mock('node:fs');

describe('loadConfig', () => {
	const ORIGINAL_ENV = process.env;

	beforeEach(() => {
		vi.resetModules();
		(process.env as any) = { ...ORIGINAL_ENV };
		vi.spyOn(console, 'log').mockImplementation(() => {
			// do nothing
		});
		(path.resolve as unknown as Mock | undefined)?.mockReset?.();
		(fs.readFileSync as unknown as Mock | undefined)?.mockReset?.();
	});

	afterAll(() => {
		(process.env as any) = ORIGINAL_ENV;
	});

	it('returns DEFAULT when config file is missing', () => {
		(process.env as any).Z21_CONFIG = undefined;
		(fs.readFileSync as unknown as Mock).mockImplementation(() => {
			throw new Error('ENOENT');
		});

		const cfg = loadConfig();

		expect(cfg).toEqual({
			httpPort: 8080,
			z21: { host: '192.168.0.111', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});
	});

	it('uses Z21_CONFIG env var to resolve path and loads file', () => {
		(process.env as any).Z21_CONFIG = 'custom/path/config.json';
		(fs.readFileSync as unknown as Mock).mockReturnValue(JSON.stringify({ httpPort: 3000 }));

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(3000);
		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105 });
		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: true });
	});

	it('loads config.json from CWD when env var is not set', () => {
		(process.env as any).Z21_CONFIG = undefined;
		(fs.readFileSync as unknown as Mock).mockReturnValue(JSON.stringify({ z21: { host: '10.0.0.5' } }));

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(8080);
		expect(cfg.z21).toEqual({ host: '10.0.0.5', udpPort: 21105 });
	});

	it('deep merges nested z21 and safety sections while preserving defaults', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				httpPort: 9090,
				z21: { udpPort: 30000 },
				safety: {}
			})
		);

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(9090);
		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 30000 });
		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: true });
	});

	it('falls back to DEFAULT on JSON parse error', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue('this is not json');

		const cfg = loadConfig();
		expect(cfg).toEqual({
			httpPort: 8080,
			z21: { host: '192.168.0.111', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});
	});

	it('includes dev config when provided', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				dev: { logLevel: 'debug', subscribeLocoAddr: 50 }
			})
		);

		const cfg = loadConfig();

		expect(cfg.dev).toEqual({ logLevel: 'debug', subscribeLocoAddr: 50 });
	});

	it('merges z21.listenPort when specified', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				z21: { listenPort: 25000 }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105, listenPort: 25000 });
	});

	it('merges z21.debug flag when specified', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				z21: { debug: true }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105, debug: true });
	});

	it('overrides safety.stopAllOnClientDisconnect to false', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				safety: { stopAllOnClientDisconnect: false }
			})
		);

		const cfg = loadConfig();

		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: false });
	});

	it('merges multiple z21 properties together', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				z21: { host: '10.0.0.50', listenPort: 22000, debug: true }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '10.0.0.50', udpPort: 21105, listenPort: 22000, debug: true });
	});

	it('preserves all config properties when complete override is provided', () => {
		(fs.readFileSync as unknown as Mock).mockReturnValue(
			JSON.stringify({
				httpPort: 5000,
				z21: { host: '192.168.1.1', udpPort: 30000, listenPort: 30001, debug: false },
				safety: { stopAllOnClientDisconnect: false },
				dev: { logLevel: 'trace', subscribeLocoAddr: 100 }
			})
		);

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(5000);
		expect(cfg.z21).toEqual({ host: '192.168.1.1', udpPort: 30000, listenPort: 30001, debug: false });
		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: false });
		expect(cfg.dev).toEqual({ logLevel: 'trace', subscribeLocoAddr: 100 });
	});

	it('handles file read error and returns DEFAULT', () => {
		(fs.readFileSync as unknown as Mock).mockImplementation(() => {
			throw new Error('Permission denied');
		});

		const cfg = loadConfig();

		expect(cfg).toEqual({
			httpPort: 8080,
			z21: { host: '192.168.0.111', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});
	});
});
