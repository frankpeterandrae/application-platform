/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { BrowserSvgPersistenceService } from './browser-svg-persistence.service';

describe('BrowserSvgPersistenceService', () => {
	let service: BrowserSvgPersistenceService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(BrowserSvgPersistenceService);
	});

	it('should create and trigger a browser download', () => {
		const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');

		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

		service.save('<svg></svg>', 'test.svg');

		expect(createObjectURL).toHaveBeenCalledOnce();

		const blob = createObjectURL.mock.calls[0][0];

		expect(blob).toBeInstanceOf(Blob);
		if ('type' in blob) {
			expect(blob.type).toBe('image/svg+xml;charset=utf-8');
		}

		expect(click).toHaveBeenCalledOnce();

		expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
	});
});
