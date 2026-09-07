/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isValidSpectralType } from './spectral-type';

describe('isValidSpectralType', () => {
	it.each(['BD', 'WD', 'NS', 'BH', 'O5', 'O9', 'B0', 'A5', 'F3', 'G2', 'K7', 'M9', 'G2I', 'G2III', 'M5I', 'M5III'])(
		'should accept valid spectral type %s',
		(spectralType) => {
			expect(isValidSpectralType(spectralType)).toBe(true);
		}
	);

	it.each(['', 'O0', 'O4', 'O10', 'X1', 'G', 'G10', 'G2II', 'G2IV', 'BDI', 'wd', 'g2', 'G2 III', ' G2', 'G2 '])(
		'should reject invalid spectral type %s',
		(spectralType) => {
			expect(isValidSpectralType(spectralType)).toBe(false);
		}
	);
});
