/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { vi } from 'vitest';

import { randomSpectralType } from './spectral-type.generator';

describe('randomSpectralType', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	function mockRandom(...values: number[]): void {
		const random = vi.spyOn(Math, 'random');

		for (const value of values) {
			random.mockReturnValueOnce(value);
		}
	}

	it('should create a brown dwarf', () => {
		mockRandom(0);

		expect(randomSpectralType()).toBe('BD');
	});

	it('should create an M class star', () => {
		mockRandom(0.08, 0.5);

		expect(randomSpectralType()).toBe('M5');
	});

	it('should create a K class star', () => {
		mockRandom(0.83, 0.5);

		expect(randomSpectralType()).toBe('K5');
	});

	it('should create a G class star', () => {
		mockRandom(0.9, 0.5);

		expect(randomSpectralType()).toBe('G5');
	});

	it('should create an F class star', () => {
		mockRandom(0.93, 0.5);

		expect(randomSpectralType()).toBe('F5');
	});

	it('should create a white dwarf', () => {
		mockRandom(0.95);

		expect(randomSpectralType()).toBe('WD');
	});

	it('should create an A class star', () => {
		mockRandom(0.999, 0, 0.5);

		expect(randomSpectralType()).toBe('A5');
	});

	it('should create a B class star', () => {
		mockRandom(0.999, 0.6, 0.3);

		expect(randomSpectralType()).toBe('B5');
	});

	it('should create a giant star', () => {
		mockRandom(0.999, 0.8, 0, 0.5);

		expect(randomSpectralType()).toBe('M5III');
	});

	it('should create an O class star', () => {
		mockRandom(0.999, 0.999, 0, 0);

		expect(randomSpectralType()).toBe('O5');
	});

	it('should create a supergiant star', () => {
		mockRandom(0.999, 0.999, 0.5, 0, 0.5);

		expect(randomSpectralType()).toBe('M5I');
	});

	it('should create a neutron star', () => {
		vi.spyOn(console, 'log').mockImplementation(() => undefined);

		mockRandom(0.999, 0.999, 0.999, 0);

		expect(randomSpectralType()).toBe('NS');
	});

	it('should create a black hole', () => {
		vi.spyOn(console, 'log').mockImplementation(() => undefined);

		mockRandom(0.999, 0.999, 0.999, 0.999);

		expect(randomSpectralType()).toBe('BH');
	});

	it('should create a K giant star', () => {
		mockRandom(0.999, 0.8, 0.85, 0.5);

		expect(randomSpectralType()).toBe('K5III');
	});

	it('should create a G giant star', () => {
		mockRandom(0.999, 0.8, 0.9, 0.5);

		expect(randomSpectralType()).toBe('G5III');
	});

	it('should create an F giant star', () => {
		mockRandom(0.999, 0.8, 0.93, 0.5);

		expect(randomSpectralType()).toBe('F5III');
	});

	it('should use K as fallback giant class', () => {
		mockRandom(0.999, 0.8, 0.99, 0.5);

		expect(randomSpectralType()).toBe('K5III');
	});

	it.each([
		[0.0, 'M0'],
		[0.1, 'M1'],
		[0.2, 'M2'],
		[0.3, 'M3'],
		[0.4, 'M4'],
		[0.5, 'M5'],
		[0.6, 'M6'],
		[0.7, 'M7'],
		[0.8, 'M8'],
		[0.99, 'M9']
	])('should generate M subtype %s', (subtypeRoll, expected) => {
		mockRandom(0.08, subtypeRoll);

		expect(randomSpectralType()).toBe(expected);
	});

	it.each([
		[0.0, 'B0'],
		[0.05, 'B1'],
		[0.11, 'B2'],
		[0.17, 'B3'],
		[0.22, 'B4'],
		[0.29, 'B5'],
		[0.38, 'B6'],
		[0.49, 'B7'],
		[0.63, 'B8'],
		[0.9, 'B9']
	])('should generate B subtype %s', (subtypeRoll, expected) => {
		mockRandom(0.999, 0.6, subtypeRoll);

		expect(randomSpectralType()).toBe(expected);
	});

	it.each([
		[0.0, 'O5'],
		[0.13, 'O6'],
		[0.27, 'O7'],
		[0.43, 'O8'],
		[0.9, 'O9']
	])('should generate O subtype %s', (subtypeRoll, expected) => {
		mockRandom(0.999, 0.999, 0, subtypeRoll);

		expect(randomSpectralType()).toBe(expected);
	});
});
