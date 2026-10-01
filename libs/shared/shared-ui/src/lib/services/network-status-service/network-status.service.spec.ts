/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
	function mockNavigatorOnLine(value: boolean): void {
		Object.defineProperty(navigator, 'onLine', {
			value,
			configurable: true
		});
	}

	async function createService(online: boolean): Promise<NetworkStatusService> {
		mockNavigatorOnLine(online);

		await setupTestingModule({
			providers: [NetworkStatusService]
		});

		return TestBed.inject(NetworkStatusService);
	}

	afterEach(() => {
		TestBed.resetTestingModule();
	});

	it('should emit the initial online status', async () => {
		const service = await createService(true);

		await expect(firstValueFrom(service.status$)).resolves.toBe(true);
	});

	it('should emit the initial offline status', async () => {
		const service = await createService(false);

		await expect(firstValueFrom(service.status$)).resolves.toBe(false);
	});

	it('should emit true when the browser goes online', async () => {
		const service = await createService(false);

		const resultPromise = firstValueFrom(service.status$.pipe(take(2), toArray()));

		window.dispatchEvent(new Event('online'));

		await expect(resultPromise).resolves.toEqual([false, true]);
	});

	it('should emit false when the browser goes offline', async () => {
		const service = await createService(true);

		const resultPromise = firstValueFrom(service.status$.pipe(take(2), toArray()));

		window.dispatchEvent(new Event('offline'));

		await expect(resultPromise).resolves.toEqual([true, false]);
	});

	it('should emit subsequent online and offline changes', async () => {
		const service = await createService(false);

		const resultPromise = firstValueFrom(service.status$.pipe(take(4), toArray()));

		window.dispatchEvent(new Event('online'));
		window.dispatchEvent(new Event('offline'));
		window.dispatchEvent(new Event('online'));

		await expect(resultPromise).resolves.toEqual([false, true, false, true]);
	});
});
