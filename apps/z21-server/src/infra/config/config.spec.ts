/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { loadConfig } from './config';

// Mock Node.js modules at module level
jest.mock('node:fs');
jest.mock('node:path');

describe('loadConfig', () => {
	const ORIGINAL_ENV = process.env;

	beforeEach(() => {
		process.env = { ...ORIGINAL_ENV };

		// Mock console.log to keep tests clean
		jest.spyOn(console, 'log').mockImplementation(() => {
			// do nothing
		});

		// Mock path.resolve to return predictable paths
		(jest.mocked(path.resolve) as any).mockImplementation((...args: string[]) => args.join('/'));
	});

	afterAll(() => {
		process.env = ORIGINAL_ENV;
	});

	it('uses Z21_CONFIG env var to resolve path and loads file', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(JSON.stringify({ httpPort: 3000 }));

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(3000);
		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105 });
		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: true });
	});

	it('loads config.json from CWD when env var is not set', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(JSON.stringify({ z21: { host: '10.0.0.5' } }));

		const cfg = loadConfig();

		expect(cfg.httpPort).toBe(8080);
		expect(cfg.z21).toEqual({ host: '10.0.0.5', udpPort: 21105 });
	});

	it('deep merges nested z21 and safety sections while preserving defaults', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(
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
		(jest.mocked(fs.readFileSync) as any).mockReturnValue('this is not json');

		const cfg = loadConfig();

		expect(cfg).toEqual({
			httpPort: 8080,
			z21: { host: '192.168.0.111', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});
	});

	it('merges z21.listenPort when specified', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(
			JSON.stringify({
				z21: { listenPort: 25000 }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105, listenPort: 25000 });
	});

	it('merges z21.debug flag when specified', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(
			JSON.stringify({
				z21: { debug: true }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '192.168.0.111', udpPort: 21105, debug: true });
	});

	it('overrides safety.stopAllOnClientDisconnect to false', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(
			JSON.stringify({
				safety: { stopAllOnClientDisconnect: false }
			})
		);

		const cfg = loadConfig();

		expect(cfg.safety).toEqual({ stopAllOnClientDisconnect: false });
	});

	it('merges multiple z21 properties together', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(
			JSON.stringify({
				z21: { host: '10.0.0.50', listenPort: 22000, debug: true }
			})
		);

		const cfg = loadConfig();

		expect(cfg.z21).toEqual({ host: '10.0.0.50', udpPort: 21105, listenPort: 22000, debug: true });
	});

	it('preserves all config properties when complete override is provided', () => {
		(jest.mocked(fs.readFileSync) as any).mockReturnValue(
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
	});

	it('handles file read error and returns DEFAULT', () => {
		(jest.mocked(fs.readFileSync) as any).mockImplementation(() => {
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
