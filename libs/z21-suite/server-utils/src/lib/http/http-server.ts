/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as fs from 'node:fs';
import type * as http from 'node:http';
import * as path from 'node:path';

/**
 * Serves static application files from a configured public directory.
 *
 * Unknown routes fall back to `index.html` to support client-side routing.
 * Resolved paths are constrained to the configured public directory.
 */
export class StaticFileServer {
	private readonly publicDir: string;
	/**
	 * Creates a static file server for the given public directory.
	 *
	 * @param publicDir - Directory containing the static application files.
	 */
	constructor(publicDir: string) {
		this.publicDir = path.resolve(publicDir);
	}

	/**
	 * Handles an incoming HTTP request.
	 *
	 * @param req - Incoming HTTP request.
	 * @param res - HTTP response.
	 */
	public handle = (req: http.IncomingMessage, res: http.ServerResponse): void => {
		const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

		let pathname = url.pathname;

		try {
			pathname = decodeURIComponent(pathname);
		} catch {
			// Keep the original pathname when decoding fails.
		}

		if (pathname === '/' || pathname.includes('\0') || pathname.split('/').includes('..')) {
			pathname = '/index.html';
		}

		const normalizedPath = path.normalize(pathname);
		const resolvedPath = path.resolve(this.publicDir, `.${normalizedPath}`);
		const relativePath = path.relative(this.publicDir, resolvedPath);

		if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
			this.serveIndex(res);
			return;
		}

		fs.readFile(resolvedPath, (error, data) => {
			if (error) {
				this.serveIndex(res);
				return;
			}

			res.writeHead(200, {
				'Content-Type': this.getContentType(resolvedPath)
			});
			res.end(data);
		});
	};

	private serveIndex(res: http.ServerResponse): void {
		fs.readFile(path.join(this.publicDir, 'index.html'), (error, data) => {
			if (error) {
				res.writeHead(404);
				res.end('Not Found');
				return;
			}

			res.writeHead(200, {
				'Content-Type': 'text/html; charset=utf-8'
			});
			res.end(data);
		});
	}

	private getContentType(filePath: string): string {
		if (filePath.endsWith('.html')) {
			return 'text/html; charset=utf-8';
		}

		if (filePath.endsWith('.js')) {
			return 'application/javascript; charset=utf-8';
		}

		if (filePath.endsWith('.css')) {
			return 'text/css; charset=utf-8';
		}

		if (filePath.endsWith('.json')) {
			return 'application/json; charset=utf-8';
		}

		return 'application/octet-stream';
	}
}
