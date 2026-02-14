/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type CvOwnerType = 'family' | 'decoder';

export type CvDefinitionType = 'folder' | 'cv_number' | 'cv_boolean' | 'cv_select';

export type FolderConfig = Record<string, never>;

export type CvNumberConfig = {
	cv: number;
	min: number;
	max: number;
	default?: number;
};
export type CvBooleanConfig = {
	cv: number;
	bit: number; // 0 bis 7
	default?: boolean;
};

export type CvSelectOption = {
	value: number;
	label: string;
};

export type CvSelectConfig = {
	cv: number;
	options: CvSelectOption[];
	default?: number;
};

export type CvDefinitionConfigByType = {
	folder: FolderConfig;
	cv_number: CvNumberConfig;
	cv_boolean: CvBooleanConfig;
	cv_select: CvSelectConfig;
};

export type CvDefinitionConfig = FolderConfig | CvNumberConfig | CvBooleanConfig | CvSelectConfig;

/** Returns true when value is a plain, non-array object. */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates and parses an unknown value as a FolderConfig. */
export function parseFolderConfig(value: unknown): FolderConfig {
	if (!isObject(value)) {
		throw new Error('folder config must be an object.');
	}

	return {};
}

/** Validates and parses an unknown value as a CvNumberConfig. */
export function parseCvNumberConfig(value: unknown): CvNumberConfig {
	if (!isObject(value)) {
		throw new Error('cv_number config must be an object.');
	}

	if (typeof value['cv'] !== 'number') {
		throw new Error('cv_number config.cv must be an number.');
	}

	if (typeof value['min'] !== 'number') {
		throw new Error('cv_number config.min must be an number.');
	}

	if (typeof value['max'] !== 'number') {
		throw new Error('cv_number config.max must be an number.');
	}

	if (value['default'] !== undefined && typeof value['default'] !== 'number') {
		throw new Error('cv_number config.default must be an number.');
	}

	return {
		cv: value['cv'],
		min: value['min'],
		max: value['max'],
		default: typeof value['default'] === 'number' ? value['default'] : undefined
	};
}

/** Validates and parses an unknown value as a CvBooleanConfig. */
export function parseCvBooleanConfig(value: unknown): CvBooleanConfig {
	if (!isObject(value)) {
		throw new Error('cv_boolean config must be an object.');
	}

	if (typeof value['cv'] !== 'number') {
		throw new Error('cv_boolean config.cv must be an number.');
	}

	if (typeof value['bit'] !== 'number') {
		throw new Error('cv_boolean config.bit must be an number.');
	}

	if (value['bit'] < 0 || value['bit'] > 7) {
		throw new Error('cv_boolean config.bit muss zwischen 0 und 7 liegen.');
	}

	if (value['default'] !== undefined && typeof value['default'] !== 'boolean') {
		throw new Error('cv_boolean config.default must be an boolean.');
	}

	return {
		cv: value['cv'],
		bit: value['bit'],
		default: typeof value['default'] === 'boolean' ? value['default'] : undefined
	};
}

/** Validates and parses an unknown value as a CvSelectConfig. */
export function parseCvSelectConfig(value: unknown): CvSelectConfig {
	if (!isObject(value)) {
		throw new Error('cv_select config must be an object.');
	}

	if (typeof value['cv'] !== 'number') {
		throw new Error('cv_select config.cv must be an number.');
	}

	if (!Array.isArray(value['options'])) {
		throw new Error('cv_select config.options muss ein Array sein.');
	}

	const options = value['options'].map((option, index) => {
		if (!isObject(option)) {
			throw new Error(`cv_select option[${index}] must be an object.`);
		}

		if (typeof option['value'] !== 'number') {
			throw new Error(`cv_select option[${index}].value must be an number.`);
		}

		if (typeof option['label'] !== 'string') {
			throw new Error(`cv_select option[${index}].label muss ein String sein.`);
		}

		return {
			value: option['value'],
			label: option['label']
		};
	});

	if (value['default'] !== undefined && typeof value['default'] !== 'number') {
		throw new Error('cv_select config.default must be an number.');
	}

	return {
		cv: value['cv'],
		options,
		default: typeof value['default'] === 'number' ? value['default'] : undefined
	};
}
