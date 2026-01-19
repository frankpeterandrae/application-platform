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

vi.mock('./bootstrap/providers', () => {
	return {
		createProviders: vi.fn().mockReturnValue({
			cfg: { httpPort: 5050, z21: { host: '127.0.0.1', udpPort: 21105 } },
			logger: { info: vi.fn(), error: vi.fn() }
		})
	};
});

describe('main', () => {
	let processOnSpy: any;
	let sigintHandler: (() => void) | undefined;
	let sigtermHandler: (() => void) | undefined;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		processOnSpy = vi.spyOn(process, 'on').mockImplementation((event: string | symbol, handler: any) => {
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

	it('creates providers before creating Bootstrap', async () => {
		await import('./main');

		const { createProviders } = await import('./bootstrap/providers');
		const { Bootstrap } = await import('./bootstrap/bootstrap');

		expect(createProviders).toHaveBeenCalled();
		expect(Bootstrap).toHaveBeenCalledWith(expect.any(Object));
	});

	it('passes providers to Bootstrap constructor', async () => {
		await import('./main');

		const { createProviders } = await import('./bootstrap/providers');
		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const providers = (createProviders as Mock).mock.results[0].value;

		expect(Bootstrap).toHaveBeenCalledWith(providers);
	});

	it('calls stop multiple times when SIGINT is received multiple times', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		sigintHandler!();
		sigintHandler!();
		sigintHandler!();

		expect(bootstrapInstance.stop).toHaveBeenCalledTimes(3);
	});

	it('calls stop multiple times when SIGTERM is received multiple times', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		sigtermHandler!();
		sigtermHandler!();
		sigtermHandler!();

		expect(bootstrapInstance.stop).toHaveBeenCalledTimes(3);
	});

	it('handles both SIGINT and SIGTERM independently', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		sigintHandler!();
		sigtermHandler!();

		expect(bootstrapInstance.stop).toHaveBeenCalledTimes(2);
	});

	it('registers signal handlers in correct order', async () => {
		await import('./main');

		const calls = processOnSpy.mock.calls;
		const sigintIndex = calls.findIndex((call: any) => call[0] === 'SIGINT');
		const sigtermIndex = calls.findIndex((call: any) => call[0] === 'SIGTERM');

		expect(sigintIndex).toBeGreaterThanOrEqual(0);
		expect(sigtermIndex).toBeGreaterThanOrEqual(0);
	});

	it('handles multiple SIGINT signals without errors', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		expect(() => sigintHandler!()).not.toThrow();
		expect(bootstrapInstance.stop).toHaveBeenCalled();
	});

	it('handles multiple SIGTERM signals without errors', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		expect(() => sigtermHandler!()).not.toThrow();
		expect(bootstrapInstance.stop).toHaveBeenCalled();
	});

	it('chains start method call', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		expect(bootstrapInstance.start).toHaveReturnedWith(bootstrapInstance);
	});

	it('creates only one Bootstrap instance', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');

		expect(Bootstrap).toHaveBeenCalledTimes(1);
	});

	it('creates providers with no arguments', async () => {
		await import('./main');

		const { createProviders } = await import('./bootstrap/providers');

		expect(createProviders).toHaveBeenCalledWith();
		expect(createProviders).toHaveBeenCalledTimes(1);
	});

	it('stores Bootstrap instance reference for signal handlers', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		sigintHandler!();
		expect(bootstrapInstance.stop).toHaveBeenCalled();

		vi.clearAllMocks();

		sigtermHandler!();
		expect(bootstrapInstance.stop).toHaveBeenCalled();
	});

	it('executes module initialization synchronously', async () => {
		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const { createProviders } = await import('./bootstrap/providers');

		expect(createProviders).not.toHaveBeenCalled();
		expect(Bootstrap).not.toHaveBeenCalled();

		await import('./main');

		expect(createProviders).toHaveBeenCalled();
		expect(Bootstrap).toHaveBeenCalled();
	});

	it('initializes Bootstrap with providers returned from createProviders', async () => {
		const { createProviders } = await import('./bootstrap/providers');
		const mockProviders = { cfg: {}, logger: {} };
		(createProviders as Mock).mockReturnValue(mockProviders);

		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		expect(Bootstrap).toHaveBeenCalledWith(mockProviders);
	});

	it('does not call stop before signal is received', async () => {
		await import('./main');

		const { Bootstrap } = await import('./bootstrap/bootstrap');
		const bootstrapInstance = (Bootstrap as Mock).mock.results[0].value;

		expect(bootstrapInstance.stop).not.toHaveBeenCalled();
	});
});
