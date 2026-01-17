/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

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
});
