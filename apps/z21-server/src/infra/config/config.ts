/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Server configuration shape loaded from config.json or environment.
 * - httpPort: HTTP server listening port
 * - z21: Z21 central host and UDP port
 * - safety: runtime safety features
 */
export type ServerConfig = {
	httpPort: number;
	z21: { host: string; udpPort: number };
	safety: { stopAllOnClientDisconnect: boolean };
};

/**
 * Default configuration used when no config file is present or parsing fails.
 */
const DEFAULT: ServerConfig = {
	httpPort: 8080,
	z21: { host: '192.168.0.111', udpPort: 21105 },
	safety: { stopAllOnClientDisconnect: true }
};

/**
 * Loads the server configuration.
 *
 * Resolution:
 * - If the environment variable Z21_CONFIG is set, resolves that path.
 * - Otherwise, uses a config.json in the current working directory.
 *
 * Merge behavior:
 * - Shallow merge of the parsed file over DEFAULT.
 * - Deep-ish merge for nested z21 and safety objects to preserve defaults
 *   when specific properties are not provided.
 *
 * Fallback:
 * - Returns DEFAULT if the file is missing or cannot be parsed.
 *
 * @returns The effective ServerConfig after merging defaults and overrides.
 */
export function loadConfig(): ServerConfig {
	const p = process.env['Z21_CONFIG'] ? path.resolve(process.env['Z21_CONFIG']) : path.resolve(process.cwd(), 'config.json');

	try {
		const raw = fs.readFileSync(p, 'utf-8');
		const parsed = JSON.parse(raw);
		return {
			...DEFAULT,
			...parsed,
			z21: { ...DEFAULT.z21, ...(parsed.z21 || {}) },
			safety: { ...DEFAULT.safety, ...(parsed.safety || {}) }
		};
	} catch {
		return DEFAULT;
	}
}
