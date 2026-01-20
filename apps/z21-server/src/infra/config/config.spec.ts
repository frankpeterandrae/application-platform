/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadConfig } from './config';

// Mock Node.js modules at module level
vi.mock('node:fs');
vi.mock('node:path');

describe('loadConfig', () => {
	const ORIGINAL_ENV = process.env;

	beforeEach(() => {
		resetMocksBeforeEach({});
		process.env = { ...ORIGINAL_ENV };

		// Mock console.log to keep tests clean
		vi.spyOn(console, 'log').mockImplementation(() => {
			// do nothing
		});

		// Mock path.resolve to return predictable paths
		vi.mocked(path.resolve).mockImplementation((...args: string[]) => args.join('/'));
	});

	afterAll(() => {
		process.env = ORIGINAL_ENV;
	});

	it('returns DEFAULT when config file is missing', () => {
		process.env['Z21_CONFIG'] = undefined;
		vi.mocked(fs.readFileSync).mockImplementation(() => {
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
		process.env['Z21_CONFIG'] = 'custom/path/config.json';
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ httpPort: 3000 }));

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(3000);
		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105 });
		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: true });
	});

	it('loads config.json from CWD when env var is not set', () => {
		process.env['Z21_CONFIG'] = undefined;
		vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ z21: { host: '10.0.0.5' } }));

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(8080);
		expect(cfg.z21).toEqual({ host: '10.0.0.5', udpPort: 21105 });
	});

	it('deep merges nested z21 and safety sections while preserving defaults', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
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
		vi.mocked(fs.readFileSync).mockReturnValue('this is not json');

		const cfg = loadConfig();

		expect(cfg).toEqual({
			httpPort: 8080,
			z21: { host: '192.168.0.111', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});
	});

	it('includes dev config when provided', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				dev: { logLevel: 'debug', subscribeLocoAddr: 50 }
			})
		);

		const cfg = loadConfig();

		expect(cfg.dev).toEqual({ logLevel: 'debug', subscribeLocoAddr: 50 });
	});

	it('merges z21.listenPort when specified', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				z21: { listenPort: 25000 }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105, listenPort: 25000 });
	});

	it('merges z21.debug flag when specified', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				z21: { debug: true }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105, debug: true });
	});

	it('overrides safety.stopAllOnClientDisconnect to false', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				safety: { stopAllOnClientDisconnect: false }
			})
		);

		const cfg = loadConfig();

		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: false });
	});

	it('merges multiple z21 properties together', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				z21: { host: '10.0.0.50', listenPort: 22000, debug: true }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '10.0.0.50', udpPort: 21105, listenPort: 22000, debug: true });
	});

	it('preserves all config properties when complete override is provided', () => {
		vi.mocked(fs.readFileSync).mockReturnValue(
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
		vi.mocked(fs.readFileSync).mockImplementation(() => {
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
