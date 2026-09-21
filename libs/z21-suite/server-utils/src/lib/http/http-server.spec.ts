/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as fs from 'node:fs';
import type * as http from 'node:http';
import * as path from 'node:path';

import { DeepMock, type DeepMocked } from '@application-platform/shared-node-test';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('node:fs', () => ({
	readFile: vi.fn()
}));

import { StaticFileServer } from './http-server';

describe('StaticFileServer', () => {
	let server: StaticFileServer;
	let request: DeepMocked<http.IncomingMessage>;
	let response: DeepMocked<http.ServerResponse>;

	function makeRequest(overrides: Partial<http.IncomingMessage> = {}): DeepMocked<http.IncomingMessage> {
		const mock = DeepMock<http.IncomingMessage>();

		mock.url = '/';
		mock.headers = { host: 'localhost' };

		Object.assign(mock, overrides);

		return mock;
	}

	function mockSuccessfulRead(content: Buffer, condition?: (filePath: string) => boolean): void {
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (error: NodeJS.ErrnoException | null, data: Buffer) => void): void => {
				if (condition && !condition(filePath)) {
					callback(new Error('ENOENT') as NodeJS.ErrnoException, Buffer.alloc(0));
					return;
				}

				callback(null, content);
			}
		);
	}

	function mockMissingFiles(): void {
		(fs.readFile as unknown as Mock).mockImplementation(
			(_filePath: string, callback: (error: NodeJS.ErrnoException | null, data: Buffer) => void): void => {
				callback(new Error('ENOENT') as NodeJS.ErrnoException, Buffer.alloc(0));
			}
		);
	}

	function mockIndexFallback(indexContent: Buffer): void {
		(fs.readFile as unknown as Mock).mockImplementation(
			(filePath: string, callback: (error: NodeJS.ErrnoException | null, data: Buffer) => void): void => {
				if (filePath.endsWith('index.html')) {
					callback(null, indexContent);
					return;
				}

				callback(new Error('ENOENT') as NodeJS.ErrnoException, Buffer.alloc(0));
			}
		);
	}

	beforeEach(() => {
		vi.clearAllMocks();
		(fs.readFile as unknown as Mock).mockReset();

		server = new StaticFileServer('/public');
		request = makeRequest();
		response = DeepMock<http.ServerResponse>();
	});

	describe('file serving', () => {
		it('serves index.html for the root path', () => {
			const content = Buffer.from('<html></html>');
			mockSuccessfulRead(content);

			server.handle(request, response);

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/public', 'index.html'), expect.any(Function));
			expect(response.writeHead).toHaveBeenCalledWith(200, {
				'Content-Type': 'text/html; charset=utf-8'
			});
			expect(response.end).toHaveBeenCalledWith(content);
		});

		it.each([
			['/page.html', 'text/html; charset=utf-8'],
			['/app.js', 'application/javascript; charset=utf-8'],
			['/styles.css', 'text/css; charset=utf-8'],
			['/data.json', 'application/json; charset=utf-8'],
			['/image.png', 'application/octet-stream'],
			['/LICENSE', 'application/octet-stream']
		])('serves %s with content type %s', (url, contentType) => {
			request = makeRequest({ url });
			const content = Buffer.from('content');

			mockSuccessfulRead(content);

			server.handle(request, response);

			expect(response.writeHead).toHaveBeenCalledWith(200, {
				'Content-Type': contentType
			});
			expect(response.end).toHaveBeenCalledWith(content);
		});

		it('ignores query parameters when resolving files', () => {
			request = makeRequest({
				url: '/app.js?v=1.0'
			});

			const content = Buffer.from('script');

			mockSuccessfulRead(content);

			server.handle(request, response);

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/public/app.js'), expect.any(Function));
		});

		it('serves nested files', () => {
			request = makeRequest({
				url: '/assets/css/main.css'
			});

			const content = Buffer.from('body {}');

			mockSuccessfulRead(content);

			server.handle(request, response);

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/public/assets/css/main.css'), expect.any(Function));
		});
	});

	describe('SPA fallback', () => {
		it('serves index.html when the requested file does not exist', () => {
			request = makeRequest({
				url: '/route/not-found'
			});

			const indexContent = Buffer.from('<html></html>');

			mockIndexFallback(indexContent);

			server.handle(request, response);

			expect(response.writeHead).toHaveBeenCalledWith(200, {
				'Content-Type': 'text/html; charset=utf-8'
			});
			expect(response.end).toHaveBeenCalledWith(indexContent);
		});

		it('returns 404 when index.html is unavailable', () => {
			request = makeRequest({
				url: '/route/not-found'
			});

			mockMissingFiles();

			server.handle(request, response);

			expect(response.writeHead).toHaveBeenCalledWith(404);
			expect(response.end).toHaveBeenCalledWith('Not Found');
		});
	});

	describe('path handling', () => {
		it('does not read files outside the public directory', () => {
			request = makeRequest({
				url: '../../../etc/passwd'
			});

			const indexContent = Buffer.from('<html></html>');
			mockIndexFallback(indexContent);

			server.handle(request, response);

			for (const [filePath] of (fs.readFile as unknown as Mock).mock.calls) {
				expect(path.relative('/public', String(filePath)).startsWith('..')).toBe(false);
			}
		});

		it('keeps encoded traversal paths inside the public directory', () => {
			request = makeRequest({
				url: '/assets/%2e%2e/%2e%2e/secret'
			});

			const indexContent = Buffer.from('<html></html>');
			mockIndexFallback(indexContent);

			server.handle(request, response);

			expect(fs.readFile).toHaveBeenNthCalledWith(1, path.resolve('/public', 'secret'), expect.any(Function));

			expect(fs.readFile).toHaveBeenNthCalledWith(2, path.resolve('/public', 'index.html'), expect.any(Function));

			expect(response.writeHead).toHaveBeenCalledWith(200, {
				'Content-Type': 'text/html; charset=utf-8'
			});
		});

		it('falls back to index.html for null bytes', () => {
			request = makeRequest({
				url: '/test%00.txt'
			});

			const indexContent = Buffer.from('<html></html>');
			mockIndexFallback(indexContent);

			server.handle(request, response);

			expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/public', 'index.html'), expect.any(Function));
		});
	});

	describe('request defaults', () => {
		it('handles a missing request URL', () => {
			request = makeRequest({
				url: undefined
			});

			const content = Buffer.from('<html></html>');
			mockSuccessfulRead(content);

			server.handle(request, response);

			expect(response.writeHead).toHaveBeenCalledWith(200, {
				'Content-Type': 'text/html; charset=utf-8'
			});
		});

		it('handles a missing host header', () => {
			request = makeRequest({
				headers: {}
			});

			const content = Buffer.from('<html></html>');
			mockSuccessfulRead(content);

			server.handle(request, response);

			expect(response.writeHead).toHaveBeenCalledWith(200, {
				'Content-Type': 'text/html; charset=utf-8'
			});
		});
	});
});
