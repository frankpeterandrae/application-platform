/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { parseCvBooleanConfig, parseCvNumberConfig, parseCvSelectConfig, parseFolderConfig } from './cv-definition-types';

describe('parseFolderConfig', () => {
	it('returns an empty folder config for object input', () => {
		expect(parseFolderConfig({ any: 'value' })).toEqual({});
	});

	it('throws when value is not an object', () => {
		expect(() => parseFolderConfig(null)).toThrow('folder config must be an object.');
		expect(() => parseFolderConfig('x')).toThrow('folder config must be an object.');
		expect(() => parseFolderConfig([])).toThrow('folder config must be an object.');
	});
});

describe('parseCvNumberConfig', () => {
	it('parses a valid cv_number config with default', () => {
		expect(
			parseCvNumberConfig({
				cv: 1,
				min: 0,
				max: 255,
				default: 10
			})
		).toEqual({
			cv: 1,
			min: 0,
			max: 255,
			default: 10
		});
	});

	it('parses a valid cv_number config without default', () => {
		expect(
			parseCvNumberConfig({
				cv: 7,
				min: 1,
				max: 100
			})
		).toEqual({
			cv: 7,
			min: 1,
			max: 100,
			default: undefined
		});
	});

	it('throws when required number fields are missing or invalid', () => {
		expect(() => parseCvNumberConfig({ min: 0, max: 255 })).toThrow('cv_number config.cv must be an number.');
		expect(() => parseCvNumberConfig({ cv: 1, max: 255 })).toThrow('cv_number config.min must be an number.');
		expect(() => parseCvNumberConfig({ cv: 1, min: 0 })).toThrow('cv_number config.max must be an number.');
		expect(() => parseCvNumberConfig({ cv: '1', min: 0, max: 255 })).toThrow('cv_number config.cv must be an number.');
	});

	it('throws when default is present but not a number', () => {
		expect(() => parseCvNumberConfig({ cv: 1, min: 0, max: 255, default: 'x' })).toThrow('cv_number config.default must be an number.');
	});
});

describe('parseCvBooleanConfig', () => {
	it('parses a valid cv_boolean config with default', () => {
		expect(
			parseCvBooleanConfig({
				cv: 3,
				bit: 7,
				default: true
			})
		).toEqual({
			cv: 3,
			bit: 7,
			default: true
		});
	});

	it('parses a valid cv_boolean config without default', () => {
		expect(
			parseCvBooleanConfig({
				cv: 3,
				bit: 0
			})
		).toEqual({
			cv: 3,
			bit: 0,
			default: undefined
		});
	});

	it('throws when bit is out of allowed range', () => {
		expect(() => parseCvBooleanConfig({ cv: 3, bit: -1 })).toThrow('cv_boolean config.bit muss zwischen 0 und 7 liegen.');
		expect(() => parseCvBooleanConfig({ cv: 3, bit: 8 })).toThrow('cv_boolean config.bit muss zwischen 0 und 7 liegen.');
	});

	it('throws when required fields are missing or invalid', () => {
		expect(() => parseCvBooleanConfig({ bit: 1 })).toThrow('cv_boolean config.cv must be an number.');
		expect(() => parseCvBooleanConfig({ cv: 1 })).toThrow('cv_boolean config.bit must be an number.');
		expect(() => parseCvBooleanConfig({ cv: 1, bit: '1' })).toThrow('cv_boolean config.bit must be an number.');
		expect(() => parseCvBooleanConfig({ cv: 1, bit: 1, default: 'yes' })).toThrow('cv_boolean config.default must be an boolean.');
	});
});

describe('parseCvSelectConfig', () => {
	it('parses a valid cv_select config with options and default', () => {
		expect(
			parseCvSelectConfig({
				cv: 29,
				options: [
					{ value: 0, label: 'Off' },
					{ value: 1, label: 'On' }
				],
				default: 1
			})
		).toEqual({
			cv: 29,
			options: [
				{ value: 0, label: 'Off' },
				{ value: 1, label: 'On' }
			],
			default: 1
		});
	});

	it('parses a valid cv_select config without default', () => {
		expect(
			parseCvSelectConfig({
				cv: 29,
				options: [{ value: 0, label: 'Off' }]
			})
		).toEqual({
			cv: 29,
			options: [{ value: 0, label: 'Off' }],
			default: undefined
		});
	});

	it('throws when options is not an array', () => {
		expect(() => parseCvSelectConfig({ cv: 1, options: 'x' })).toThrow('cv_select config.options muss ein Array sein.');
	});

	it('throws when an option entry is invalid', () => {
		expect(() => parseCvSelectConfig({ cv: 1, options: [null] })).toThrow('cv_select option[0] must be an object.');
		expect(() => parseCvSelectConfig({ cv: 1, options: [{ label: 'A' }] })).toThrow('cv_select option[0].value must be an number.');
		expect(() => parseCvSelectConfig({ cv: 1, options: [{ value: 1, label: 2 }] })).toThrow(
			'cv_select option[0].label muss ein String sein.'
		);
	});

	it('throws when default is present but not a number', () => {
		expect(() => parseCvSelectConfig({ cv: 1, options: [{ value: 1, label: 'A' }], default: '1' })).toThrow(
			'cv_select config.default must be an number.'
		);
	});
});
