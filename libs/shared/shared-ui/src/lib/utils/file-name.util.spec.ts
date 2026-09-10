/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { createFileName } from './file-name.util';

describe('createFileName', () => {
	it.each([
		['Halo Stars', 'halo-stars'],
		['  Halo   Stars  ', 'halo-stars'],
		['Halo: Stars!', 'halo-stars'],
		['', 'starmap']
	])('should convert "%s" to "%s"', (input, expected) => {
		expect(createFileName(input)).toBe(expected);
	});
});
