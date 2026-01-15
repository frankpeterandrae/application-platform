/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as fs from 'node:fs';
import type * as http from 'node:http';
import * as path from 'node:path';

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { createStaticFileServer } from './http-server';

// Mock node:fs and override readFile with a mock function while preserving other exports
vi.mock('node:fs', async () => {
	const actual = await vi.importActual<typeof fs>('node:fs');
	return {
		...actual,
		readFile: vi.fn()
	};
});

describe('createStaticFileServer', () => {
	let mockReq: Partial<http.IncomingMessage>;
	let mockRes: Partial<http.ServerResponse>;
	let writeHeadSpy: Mock;
	let endSpy: Mock;

	beforeEach(() => {
		vi.clearAllMocks();
		writeHeadSpy = vi.fn();
		endSpy = vi.fn();
		// Reset the mocked readFile provided by the module mock
		(fs.readFile as unknown as Mock).mockReset?.();
		mockReq = {
			url: '/',
			headers: { host: 'localhost' }
		};
		mockRes = {
			writeHead: writeHeadSpy,
			end: endSpy
		};
	});

	it('serves index.html for root path', () => {
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('<html lang="en"></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void): void => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/public/index.html'), expect.any(Function));
		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('serves HTML file with correct content type', () => {
		mockReq.url = '/page.html';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('<html lang="en"></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('serves JavaScript file with correct content type', () => {
		mockReq.url = '/app.js';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('console.log("test")');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('serves CSS file with correct content type', () => {
		mockReq.url = '/styles.css';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('body { margin: 0; }');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/css; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('serves JSON file with correct content type', () => {
		mockReq.url = '/data.json';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('{"key":"value"}');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('serves other files with octet-stream content type', () => {
		mockReq.url = '/image.png';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('binary data');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('falls back to index.html when requested file does not exist', () => {
		mockReq.url = '/nonexistent';
		const handler = createStaticFileServer('/public');
		const indexContent = Buffer.from('<html lang="en"></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void) => {
				if (filePath.includes('nonexistent')) {
					callback(new Error('ENOENT'), null);
				} else if (filePath.includes('index.html')) {
					callback(null, indexContent);
				}
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(indexContent);
	});

	it('returns 404 when file and index.html both do not exist', () => {
		mockReq.url = '/nonexistent';
		const handler = createStaticFileServer('/public');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void) => {
				callback(new Error('ENOENT'), null);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(404);
		expect(endSpy).toHaveBeenCalledWith('Not Found');
	});

	it('normalizes path traversal attempts within public directory', () => {
		mockReq.url = '../../../etc/passwd';
		const handler = createStaticFileServer('/public');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void) => {
				callback(new Error('ENOENT'), null);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		const firstCall = (fs.readFile as unknown as Mock).mock.calls[0][0];
		expect(firstCall).toContain(path.resolve('/public'));
	});

	it('handles missing url gracefully', () => {
		mockReq.url = undefined;
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('<html lang="en"></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
	});

	it('handles missing host header gracefully', () => {
		mockReq.headers = {};
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('<html lang="en"></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
	});

	it('resolves public directory path', () => {
		const handler = createStaticFileServer('public');
		const fileContent = Buffer.from('<html lang="en"></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(fs.readFile).toHaveBeenCalledWith(path.resolve('public/index.html'), expect.any(Function));
	});

	it('serves files with query strings by ignoring query parameters', () => {
		mockReq.url = '/app.js?v=1.0';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('console.log("test")');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('serves files with path segments with query strings', () => {
		mockReq.url = '/assets/script.js?cache=false';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('var x = 1;');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
	});

	it('serves nested files correctly', () => {
		mockReq.url = '/assets/css/main.css';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('body { color: blue; }');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/css; charset=utf-8' });
		expect(endSpy).toHaveBeenCalledWith(fileContent);
	});

	it('falls back to index.html for nested non-existent paths', () => {
		mockReq.url = '/api/users/123';
		const handler = createStaticFileServer('/public');
		const indexContent = Buffer.from('<html></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void) => {
				if (filePath.includes('users')) {
					callback(new Error('ENOENT'), null);
				} else if (filePath.includes('index.html')) {
					callback(null, indexContent);
				}
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
	});

	it('handles empty pathname from URL', () => {
		mockReq.url = 'http://example.com';
		mockReq.headers = { host: 'example.com' };
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('<html></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
	});

	it('serves file with dot in filename correctly', () => {
		mockReq.url = '/app.min.js';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('var x=1;');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
	});

	it('serves files with uppercase extensions', () => {
		mockReq.url = '/style.CSS';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('body { margin: 0; }');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
	});

	it('serves files without extension with octet-stream', () => {
		mockReq.url = '/LICENSE';
		const handler = createStaticFileServer('/public');
		const fileContent = Buffer.from('MIT License');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => {
				callback(null, fileContent);
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
	});

	it('handles trailing slash in URL', () => {
		mockReq.url = '/assets/';
		const handler = createStaticFileServer('/public');
		const indexContent = Buffer.from('<html></html>');
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void) => {
				if (filePath.includes('assets')) {
					callback(new Error('ENOENT'), null);
				} else if (filePath.includes('index.html')) {
					callback(null, indexContent);
				}
			}
		);

		handler(mockReq as http.IncomingMessage, mockRes as http.ServerResponse);

		expect(writeHeadSpy).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
	});
});
