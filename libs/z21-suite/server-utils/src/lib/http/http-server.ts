/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as fs from 'node:fs';
import type * as http from 'node:http';
import * as path from 'node:path';

/**
 * Determines the Content-Type based on the file extension.
 * @param filePath - The path of the file
 * @returns The corresponding Content-Type string
 */
function getContentType(filePath: string): string {
	if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
	if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
	if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
	if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
	return 'application/octet-stream';
}

/**
 * Creates a static file server handler for serving files from a public directory.
 *
 * Features:
 * - Serves files from the specified public directory
 * - Maps root path "/" to "/index.html"
 * - Falls back to index.html for non-existent files (SPA support)
 * - Prevents path traversal attacks by validating resolved paths
 * - Sets appropriate Content-Type headers based on file extension
 *
 * Supported Content-Types:
 * - .html → text/html; charset=utf-8
 * - .js → application/javascript; charset=utf-8
 * - .css → text/css; charset=utf-8
 * - .json → application/json; charset=utf-8
 * - others → application/octet-stream
 *
 * @param publicDir - Path to the directory containing static files to serve
 * @returns HTTP request handler function compatible with http.createServer
 *
 * @example
 * ```typescript
 * const handler = createStaticFileServer('./public');
 * const server = http.createServer(handler);
 * server.listen(8080);
 */
export function createStaticFileServer(publicDir: string): (req: http.IncomingMessage, res: http.ServerResponse) => void {
	return (req: http.IncomingMessage, res: http.ServerResponse): void => {
		// Use the raw URL to detect obvious path traversal attempts before URL normalization
		const rawUrl = req.url ?? '/';
		// Reject common path traversal patterns in the raw URL (../ or encoded %2e%2e)
		const lowerRaw = String(rawUrl).toLowerCase();
		if (lowerRaw.includes('..') || lowerRaw.includes('%2e%2e')) {
			// eslint-disable-next-line no-console
			console.log('[http] suspicious path in raw URL:', rawUrl);
			// continue and let the normal fallback behavior handle this case
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
			// Instead of rejecting outright respond with index.html (SPA fallback)
			p = '/index.html';
		}

		if (p === '/') {
			p = '/index.html';
		}

		// Reject null bytes early
		if (p.includes('\0')) {
			// Treat malformed paths as "not found" and fallback to index.html
			p = '/index.html';
		}
		// Normalize and resolve the requested path against publicDir.
		// Use path.resolve + path.relative to make sure the final path is inside publicDir
		const normalized = path.normalize(p);
		const resolvedPath = path.resolve(publicDir, '.' + normalized);
		const relative = path.relative(publicDir, resolvedPath);

		// If the resolved path is outside the public dir, fall back to index.html (SPA)
		if (relative.startsWith('..') || path.isAbsolute(relative)) {
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
	};
}
