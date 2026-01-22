/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as fs from 'node:fs';
import type * as http from 'node:http';
import * as path from 'node:path';

import { DeepMock, type DeepMocked } from '@application-platform/shared-node-test';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// DeepMock the node:fs module so its named exports (like readFile) are writable
// and mockImplementation can be applied under ESM.
vi.mock('node:fs', () => ({
	readFile: vi.fn()
}));

import { createStaticFileServer } from './http-server';

// note: we don't auto-mock 'node:fs' here; tests use vi.spyOn(fs, 'readFile')
// to mock specific behaviors per-test.

describe('createStaticFileServer', () => {
	let mockReq: DeepMocked<http.IncomingMessage>;
	let mockRes: DeepMocked<http.ServerResponse>;

	// Helper function to create mock request (similar to makeProviders in bootstrap.spec.ts)
	function makeMockRequest(overrides: Partial<http.IncomingMessage> = {}): DeepMocked<http.IncomingMessage> {
		const mock = DeepMock<http.IncomingMessage>();
		mock.url = '/';
		mock.headers = { host: 'localhost' };
		Object.assign(mock, overrides);
		return mock;
	}

	// Helper function to create mock response
	function makeMockResponse(): DeepMocked<http.ServerResponse> {
		return DeepMock<http.ServerResponse>();
	}

	// Helper function to setup fs.readFile mock for successful file read
	function mockFileRead(fileContent: Buffer, condition?: (filePath: string) => boolean): void {
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void): void => {
				if (condition && !condition(filePath)) {
					callback(new Error('ENOENT') as NodeJS.ErrnoException, null as any);
				} else {
					callback(null, fileContent);
				}
			}
		);
	}

	// Helper function to setup fs.readFile mock for file not found
	function mockFileNotFound(): void {
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void): void => {
				callback(new Error('ENOENT') as NodeJS.ErrnoException, null);
			}
		);
	}

	// Helper function to setup fs.readFile mock with fallback to index.html
	function mockFileWithIndexFallback(indexContent: Buffer): void {
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (err: NodeJS.ErrnoException | null, data: Buffer | null) => void): void => {
				if (filePath.includes('index.html')) {
					callback(null, indexContent);
				} else {
					callback(new Error('ENOENT') as NodeJS.ErrnoException, null);
				}
			}
		);
	}

	beforeEach(() => {
		// Clear mock call history and reset the mocked readFile implementation
		vi.clearAllMocks();
		// Ensure fs.readFile is a mock function we control
		(fs.readFile as unknown as Mock).mockReset();
		mockReq = makeMockRequest();
		mockRes = makeMockResponse();
	});

	describe('basic file serving', () => {
		it('serves index.html for root path', () => {
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('<html></html>');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/public/index.html'), expect.any(Function));
			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('serves HTML file with correct content type', () => {
			mockReq = makeMockRequest({ url: '/page.html' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('<html></html>');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('resolves public directory path', () => {
			const handler = createStaticFileServer('public');
			const fileContent = Buffer.from('<html></html>');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('public/index.html'), expect.any(Function));
		});
	});

	describe('content type handling', () => {
		it('serves JavaScript file with correct content type', () => {
			mockReq = makeMockRequest({ url: '/app.js' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('console.log("test")');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('serves CSS file with correct content type', () => {
			mockReq = makeMockRequest({ url: '/styles.css' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('body { margin: 0; }');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/css; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('serves JSON file with correct content type', () => {
			mockReq = makeMockRequest({ url: '/data.json' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('{"key":"value"}');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('serves other files with octet-stream content type', () => {
			mockReq = makeMockRequest({ url: '/image.png' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('binary data');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('serves files with uppercase extensions', () => {
			mockReq = makeMockRequest({ url: '/style.CSS' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('body { margin: 0; }');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
		});

		it('serves files without extension with octet-stream', () => {
			mockReq = makeMockRequest({ url: '/LICENSE' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('MIT License');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/octet-stream' });
		});
	});

	describe('fallback handling', () => {
		it('falls back to index.html when requested file does not exist', () => {
			mockReq = makeMockRequest({ url: '/nonexistent' });
			const handler = createStaticFileServer('/public');
			const indexContent = Buffer.from('<html></html>');
			mockFileWithIndexFallback(indexContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(indexContent);
		});

		it('returns 404 when file and index.html both do not exist', () => {
			mockReq = makeMockRequest({ url: '/nonexistent' });
			const handler = createStaticFileServer('/public');
			mockFileNotFound();

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(404);
			expect(mockRes.end).toHaveBeenCalledWith('Not Found');
		});

		it('falls back to index.html for nested non-existent paths', () => {
			mockReq = makeMockRequest({ url: '/api/users/123' });
			const handler = createStaticFileServer('/public');
			const indexContent = Buffer.from('<html></html>');
			mockFileWithIndexFallback(indexContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		});

		it('handles trailing slash in URL', () => {
			mockReq = makeMockRequest({ url: '/assets/' });
			const handler = createStaticFileServer('/public');
			const indexContent = Buffer.from('<html></html>');
			mockFileWithIndexFallback(indexContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		});
	});

	describe('security', () => {
		it('normalizes path traversal attempts within public directory', () => {
			mockReq = makeMockRequest({ url: '../../../etc/passwd' });
			const handler = createStaticFileServer('/public');
			mockFileNotFound();

			handler(mockReq as any, mockRes as any);

			const firstCall = (fs.readFile as unknown as Mock).mock.calls[0][0];
			expect(firstCall).toContain(path.resolve('/public'));
		});
	});

	describe('edge cases', () => {
		it('handles missing url gracefully', () => {
			mockReq = makeMockRequest({ url: undefined });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('<html></html>');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		});

		it('handles missing host header gracefully', () => {
			mockReq = makeMockRequest({ headers: {} });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('<html></html>');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		});

		it('handles empty pathname from URL', () => {
			mockReq = makeMockRequest({ url: 'http://example.com', headers: { host: 'example.com' } });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('<html></html>');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
		});
	});

	describe('URL handling', () => {
		it('serves files with query strings by ignoring query parameters', () => {
			mockReq = makeMockRequest({ url: '/app.js?v=1.0' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('console.log("test")');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});

		it('serves files with path segments with query strings', () => {
			mockReq = makeMockRequest({ url: '/assets/script.js?cache=false' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('var x = 1;');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
		});

		it('serves file with dot in filename correctly', () => {
			mockReq = makeMockRequest({ url: '/app.min.js' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('var x=1;');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
		});
	});

	describe('nested files', () => {
		it('serves nested files correctly', () => {
			mockReq = makeMockRequest({ url: '/assets/css/main.css' });
			const handler = createStaticFileServer('/public');
			const fileContent = Buffer.from('body { color: blue; }');
			mockFileRead(fileContent);

			handler(mockReq as any, mockRes as any);

			expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/css; charset=utf-8' });
			expect(mockRes.end).toHaveBeenCalledWith(fileContent);
		});
	});
});
