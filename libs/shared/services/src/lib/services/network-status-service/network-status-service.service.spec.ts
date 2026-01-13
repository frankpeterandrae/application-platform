/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { NetworkStatusServiceService } from './network-status-service.service';

/**
 * Test suite for NetworkStatusServiceService.
 */
describe('NetworkStatusServiceService', () => {
	let service: NetworkStatusServiceService;

	/**
	 * Utility function to mock navigator.onLine.
	 * @param {boolean} value - The value to set for navigator.onLine.
	 */
	const mockNavigatorOnLine = (value: boolean): void => {
		Object.defineProperty(navigator, 'onLine', {
			value,
			configurable: true
		});
	};

	/**
	 * Sets up the testing module and injects the service before each test.
	 */
	beforeEach(async () => {
		mockNavigatorOnLine(true);

		await setupTestingModule({
			providers: [NetworkStatusServiceService]
		});
		service = TestBed.inject(NetworkStatusServiceService);
	});

	/**
	 * Resets all mocks after each test to avoid interference.
	 */
	afterEach(() => {
		vi.resetAllMocks();
	});

	/**
	 * Test to check if the service is created.
	 */
	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	/**
	 * Test to check if the service emits the initial online status.
	 * @param done - Callback to indicate the test is complete.
	 */
	it('should emit the initial online status', async () => {
		mockNavigatorOnLine(true);

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [NetworkStatusServiceService]
		});
		service = TestBed.inject(NetworkStatusServiceService);

		await new Promise<void>((resolve) => {
			service.status$.pipe(take(1)).subscribe((status) => {
				expect(status).toBe(true);
				resolve();
			});
		});
	});

	/**
	 * Test to check if the service emits the initial offline status.
	 * @param done - Callback to indicate the test is complete.
	 */
	it('should emit the initial offline status', async () => {
		mockNavigatorOnLine(false);

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [NetworkStatusServiceService]
		});
		service = TestBed.inject(NetworkStatusServiceService);

		await new Promise<void>((resolve) => {
			service.status$.pipe(take(1)).subscribe((status) => {
				expect(status).toBe(false);
				resolve();
			});
		});
	});

	/**
	 * Test to check if the service emits true when the online event is dispatched.
	 * @param done - Callback to indicate the test is complete.
	 */
	it('should emit true when online event is dispatched', async () => {
		mockNavigatorOnLine(false);

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [NetworkStatusServiceService]
		});
		service = TestBed.inject(NetworkStatusServiceService);

		const emittedStatuses: boolean[] = [];

		const p = new Promise<void>((resolve) => {
			const subscription = service.status$.subscribe((status) => {
				emittedStatuses.push(status);
				if (emittedStatuses.length === 2) {
					expect(emittedStatuses).toEqual([false, true]);
					subscription.unsubscribe();
					resolve();
				}
			});
		});

		window.dispatchEvent(new Event('online'));
		await p;
	});

	/**
	 * Test to check if the service emits false when the offline event is dispatched.
	 * @param done - Callback to indicate the test is complete.
	 */
	it('should emit false when offline event is dispatched', async () => {
		mockNavigatorOnLine(true);

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [NetworkStatusServiceService]
		});
		service = TestBed.inject(NetworkStatusServiceService);

		const emittedStatuses: boolean[] = [];

		const p = new Promise<void>((resolve) => {
			const subscription = service.status$.subscribe((status) => {
				emittedStatuses.push(status);
				if (emittedStatuses.length === 2) {
					expect(emittedStatuses).toEqual([true, false]);
					subscription.unsubscribe();
					resolve();
				}
			});
		});

		window.dispatchEvent(new Event('offline'));
		await p;
	});

	/**
	 * Test to check if the service handles multiple online and offline events correctly.
	 * @param done - Callback to indicate the test is complete.
	 */
	it('should handle multiple online and offline events correctly', async () => {
		mockNavigatorOnLine(false);

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [NetworkStatusServiceService]
		});
		service = TestBed.inject(NetworkStatusServiceService);

		const expectedStatuses = [false, true, false, true];
		const receivedStatuses: boolean[] = [];

		const p = new Promise<void>((resolve) => {
			const subscription = service.status$.subscribe((status) => {
				receivedStatuses.push(status);
				if (receivedStatuses.length === expectedStatuses.length) {
					expect(receivedStatuses).toEqual(expectedStatuses);
					subscription.unsubscribe();
					resolve();
				}
			});
		});

		window.dispatchEvent(new Event('online'));
		window.dispatchEvent(new Event('offline'));
		window.dispatchEvent(new Event('online'));
		await p;
	});
});
