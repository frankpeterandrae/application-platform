/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BrowserFileService } from './browser-file.service';

describe('BrowserFileService', () => {
	let service: BrowserFileService;

	beforeEach(() => {
		service = TestBed.inject(BrowserFileService);
	});

	it('should save content as browser download', () => {
		const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');

		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

		const click = vi.fn();

		const link = document.createElement('a');
		link.click = click;

		vi.spyOn(document, 'createElement').mockReturnValue(link);

		service.save('content', 'map.json', 'application/json;charset=utf-8');

		expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
		expect(link.href).toBe('blob:test');
		expect(link.download).toBe('map.json');
		expect(click).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
	});
});
