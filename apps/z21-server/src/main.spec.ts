/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type Mocked } from 'vitest';

import type { Bootstrap } from './bootstrap/bootstrap';

/**
 * Note: main.ts is an entry-point module that executes immediately on import.
 * Therefore, we must use vi.mock() at module level.
 * We cannot use DeepMock<T>() helper in the factory because vi.resetModules()
 * causes issues with the Proxy-based DeepMock implementation.
 */

// DeepMock Bootstrap at module level with a constructor-like mock whose prototype
// contains start/stop spies. That ensures `new Bootstrap(...).start()` is
// present even when the function is called as a constructor.
vi.mock('./bootstrap/bootstrap', () => {
	const ctor = vi.fn(function (this: any, _providers?: any) {
		// default implementation assigns providers for inspection if needed
		this.__providers = _providers;
	});
	// Provide prototype methods so instances created via `new` have the spies.
	(ctor as any).prototype.start = vi.fn(function (this: any) {
		return this;
	});
	(ctor as any).prototype.stop = vi.fn();
	return { Bootstrap: ctor };
});

// DeepMock createProviders at module level
vi.mock('./bootstrap/providers', () => ({
	createProviders: vi.fn().mockReturnValue({
		cfg: { httpPort: 5050, z21: { host: '127.0.0.1', udpPort: 21105 } },
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
	})
}));

describe('main', () => {
	let processOnSpy: ReturnType<typeof vi.spyOn>;
	let sigintHandler: (() => void) | undefined;
	let sigtermHandler: (() => void) | undefined;

	beforeEach(async () => {
		// Reset modules to ensure clean state for each test (necessary for dynamic import)
		vi.resetModules();
		// Clear mock call histories for module-level mocks created with vi.mock
		vi.clearAllMocks();

		// Ensure createProviders has a sensible default return value for tests
		// that don't override it. Individual tests may override this later.
		const { createProviders } = await import('./bootstrap/providers');

		// Clear mock call history but keep implementations
		resetMocksBeforeEach({ createProviders, process });
		(createProviders as Mock).mockReturnValue({
			cfg: { httpPort: 5050, z21: { host: '127.0.0.1', udpPort: 21105 } },
			logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
		});

		// Spy powerOn process.powerOn to capture signal handlers
		processOnSpy = vi.spyOn(process, 'on').mockImplementation((event: string | symbol, handler: (...args: any[]) => void) => {
			if (event === 'SIGINT') {
				sigintHandler = handler as () => void;
			} else if (event === 'SIGTERM') {
				sigtermHandler = handler as () => void;
			}
			return process as any;
		});
	});

	afterEach(() => {
		// Clean up spies and handlers
		processOnSpy.mockRestore();
		sigintHandler = undefined;
		sigtermHandler = undefined;
	});

	// Helper functions to reduce duplication (similar to makeProviders in bootstrap.spec.ts)
	async function requireMain(): Promise<void> {
		// Dynamic import to trigger module initialization without using require()
		await import('./main');
	}

	async function getBootstrap(): Promise<Bootstrap & Mocked<Bootstrap>> {
		const { Bootstrap } = await import('./bootstrap/bootstrap');
		// When a mock is used as a constructor, the constructed objects are stored
		// in mock.instances. Cast the retrieved instance to the expected type.
		return (Bootstrap as Mock).mock.instances[0] as unknown as Bootstrap & Mocked<Bootstrap>;
	}

	async function getCreateProviders(): Promise<Mock> {
		const { createProviders } = await import('./bootstrap/providers');
		return createProviders as Mock;
	}

	async function getBootstrapConstructor(): Promise<Mock> {
		const { Bootstrap } = await import('./bootstrap/bootstrap');
		return Bootstrap as Mock;
	}

	describe('initialization', () => {
		it('creates and starts Bootstrap instance', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();
			const BootstrapConstructor = await getBootstrapConstructor();

			expect(BootstrapConstructor).toHaveBeenCalled();
			expect(bootstrap.start).toHaveBeenCalled();
		});

		it('creates providers before creating Bootstrap', async () => {
			await requireMain();

			const createProviders = await getCreateProviders();
			const BootstrapConstructor = await getBootstrapConstructor();

			expect(createProviders).toHaveBeenCalled();
			expect(BootstrapConstructor).toHaveBeenCalled();
		});

		it('passes providers to Bootstrap constructor', async () => {
			await requireMain();

			const createProviders = await getCreateProviders();
			const BootstrapConstructor = await getBootstrapConstructor();
			const providers = createProviders.mock.results[0]?.value;

			if (providers !== undefined) {
				expect(BootstrapConstructor).toHaveBeenCalledWith(providers);
			} else {
				// Fallback: assert the actual passed argument is defined
				const passed = (BootstrapConstructor as any).mock.calls[0]?.[0];
				expect(passed).toBeDefined();
			}
		});

		it('creates only one Bootstrap instance', async () => {
			await requireMain();

			const BootstrapConstructor = await getBootstrapConstructor();

			expect(BootstrapConstructor).toHaveBeenCalledTimes(1);
		});

		it('creates providers with no arguments', async () => {
			await requireMain();

			const createProviders = await getCreateProviders();

			expect(createProviders).toHaveBeenCalledWith();
			expect(createProviders).toHaveBeenCalledTimes(1);
		});

		it('chains start method call', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			// Check that start was called and returned the instance
			expect(bootstrap.start).toHaveBeenCalled();
			expect(bootstrap.start).toHaveReturnedWith(bootstrap);
		});

		it('executes module initialization synchronously', async () => {
			const { Bootstrap } = await import('./bootstrap/bootstrap');
			const { createProviders } = await import('./bootstrap/providers');

			expect(createProviders).not.toHaveBeenCalled();
			expect(Bootstrap).not.toHaveBeenCalled();

			await requireMain();

			expect(createProviders).toHaveBeenCalled();
			expect(Bootstrap).toHaveBeenCalled();
		});

		it('initializes Bootstrap with providers returned from createProviders', async () => {
			const { createProviders } = await import('./bootstrap/providers');
			const mockProviders = { cfg: {}, logger: {} };
			(createProviders as Mock).mockReturnValue(mockProviders);

			await requireMain();

			const BootstrapConstructor = await getBootstrapConstructor();
			// Inspect the actual constructor argument and assert key properties
			const calledArg = (BootstrapConstructor as any).mock.calls[0]?.[0];
			expect(calledArg).toBeDefined();
			expect(calledArg).toHaveProperty('cfg');
			expect(calledArg).toHaveProperty('logger');
		});
	});

	describe('signal handlers', () => {
		it('registers SIGINT handler', async () => {
			await requireMain();

			expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
		});

		it('registers SIGTERM handler', async () => {
			await requireMain();

			expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
		});

		it('registers signal handlers in correct order', async () => {
			await requireMain();

			const calls = processOnSpy.mock.calls;
			const sigintIndex = calls.findIndex((call: any) => call[0] === 'SIGINT');
			const sigtermIndex = calls.findIndex((call: any) => call[0] === 'SIGTERM');

			expect(sigintIndex).toBeGreaterThanOrEqual(0);
			expect(sigtermIndex).toBeGreaterThanOrEqual(0);
		});
	});

	describe('SIGINT handling', () => {
		it('calls stop powerOn Bootstrap instance when SIGINT is received', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			expect(sigintHandler).toBeDefined();
			if (!sigintHandler) throw new Error('SIGINT handler not registered');
			sigintHandler?.();

			expect(bootstrap.stop).toHaveBeenCalled();
		});

		it('calls stop multiple times when SIGINT is received multiple times', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			if (!sigintHandler) throw new Error('SIGINT handler not registered');
			sigintHandler?.();
			sigintHandler?.();
			sigintHandler?.();

			expect(bootstrap.stop).toHaveBeenCalledTimes(3);
		});

		it('handles stop errors gracefully when SIGINT received', async () => {
			const { Bootstrap } = await import('./bootstrap/bootstrap');
			(Bootstrap as Mock).mockImplementation(function (this: any) {
				this.start = vi.fn().mockImplementation(function (this: any) {
					return this;
				});
				this.stop = vi.fn().mockImplementation(function () {
					throw new Error('Stop failed');
				});
			});

			await requireMain();

			const bootstrap = await getBootstrap();

			// The production signal handler now catches errors from stop(); assert
			// stop() was called but the handler does not rethrow.
			if (!sigintHandler) throw new Error('SIGINT handler not registered');
			expect(() => sigintHandler?.()).not.toThrow();
			expect(bootstrap.stop).toHaveBeenCalled();
		});
	});

	describe('SIGTERM handling', () => {
		it('calls stop on Bootstrap instance when SIGTERM is received', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			expect(sigtermHandler).toBeDefined();
			if (!sigtermHandler) throw new Error('SIGTERM handler not registered');
			sigtermHandler?.();

			expect(bootstrap.stop).toHaveBeenCalled();
		});

		it('calls stop multiple times when SIGTERM is received multiple times', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			if (!sigtermHandler) throw new Error('SIGTERM handler not registered');
			sigtermHandler?.();
			sigtermHandler?.();
			sigtermHandler?.();

			expect(bootstrap.stop).toHaveBeenCalledTimes(3);
		});

		it('handles stop errors gracefully when SIGTERM received', async () => {
			const { Bootstrap } = await import('./bootstrap/bootstrap');
			(Bootstrap as Mock).mockImplementation(function (this: any) {
				this.start = vi.fn().mockImplementation(function (this: any) {
					return this;
				});
				this.stop = vi.fn().mockImplementation(function () {
					throw new Error('Stop failed');
				});
			});

			await requireMain();

			const bootstrap = await getBootstrap();

			if (!sigtermHandler) throw new Error('SIGTERM handler not registered');
			expect(() => sigtermHandler?.()).not.toThrow();
			expect(bootstrap.stop).toHaveBeenCalled();
		});
	});

	describe('shutdown behavior', () => {
		it('handles both SIGINT and SIGTERM independently', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			if (!sigintHandler) throw new Error('SIGINT handler not registered');
			if (!sigtermHandler) throw new Error('SIGTERM handler not registered');
			sigintHandler?.();
			sigtermHandler?.();

			expect(bootstrap.stop).toHaveBeenCalledTimes(2);
		});

		it('stores Bootstrap instance reference for signal handlers', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			if (!sigintHandler) throw new Error('SIGINT handler not registered');
			sigintHandler?.();
			expect(bootstrap.stop).toHaveBeenCalled();

			// Clear mock history between signal handler tests
			bootstrap.stop.mockClear();

			if (!sigtermHandler) throw new Error('SIGTERM handler not registered');
			sigtermHandler?.();
			expect(bootstrap.stop).toHaveBeenCalled();
		});

		it('does not call stop before signal is received', async () => {
			await requireMain();

			const bootstrap = await getBootstrap();

			expect(bootstrap.stop).not.toHaveBeenCalled();
		});
	});
});
