/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('./bootstrap/bootstrap', () => {
	const start = vi.fn().mockReturnThis();
	const stop = vi.fn();
	const Bootstrap = vi.fn(function (this: any) {
		this.start = start;
		this.stop = stop;
		return this;
	});
	return { Bootstrap };
});

describe('main', () => {
	let processOnSpy: SpyInstance;
	let sigintHandler: (() => void) | undefined;
	let sigtermHandler: (() => void) | undefined;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		processOnSpy = vi.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
			if (event === 'SIGINT') {
				sigintHandler = handler;
			} else if (event === 'SIGTERM') {
				sigtermHandler = handler;
			}
			return process;
		});
	});

	afterEach(() => {
		processOnSpy.mockRestore();
		sigintHandler = undefined;
		sigtermHandler = undefined;
	});

	it('creates and starts Bootstrap instance', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		expect(Bootstrap).toHaveBeenCalled();

		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;
		expect(bootstrapInstance.start).toHaveBeenCalled();
	});

	it('registers SIGINT handler', async () => {
		await import('./main');

		expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
	});

	it('registers SIGTERM handler', async () => {
		await import('./main');

		expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
	});

	it('calls stop on Bootstrap instance when SIGINT is received', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		expect(sigintHandler).toBeDefined();
		sigintHandler!();

		expect(bootstrapInstance.stop).toHaveBeenCalled();
	});

	it('calls stop on Bootstrap instance when SIGTERM is received', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		expect(sigtermHandler).toBeDefined();
		sigtermHandler!();

		expect(bootstrapInstance.stop).toHaveBeenCalled();
	});
});
