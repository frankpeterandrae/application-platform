/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionRow } from '../repos/programming/cv-definitions.repo';

import type { CvDefinitionOverrideRow } from './cv-definition-overrides';
import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';
import {
	indexRowsById,
	validateConfigForType,
	validateDecoderRows,
	validateEffectiveFlatNodes,
	validateOverrideRows
} from './effective-cv-definition-validation';

type RowInput = Partial<CvDefinitionRow> & Pick<CvDefinitionRow, 'id' | 'type'>;

function makeRow(input: RowInput): CvDefinitionRow {
	return {
		id: input.id,
		owner_type: input.owner_type ?? 'family',
		owner_id: input.owner_id ?? 'family-1',
		parent_id: input.parent_id ?? null,
		sort_order: input.sort_order ?? 10,
		key: input.key ?? input.id,
		type: input.type,
		name: input.name ?? input.id,
		description: input.description ?? null,
		config_json: input.config_json ?? '{}',
		created_at: input.created_at ?? '2026-01-01T00:00:00.000Z',
		updated_at: input.updated_at ?? '2026-01-01T00:00:00.000Z'
	};
}

type OverrideInput = Partial<CvDefinitionOverrideRow> & Pick<CvDefinitionOverrideRow, 'id' | 'decoder_id' | 'base_definition_id'>;

function makeOverride(input: OverrideInput): CvDefinitionOverrideRow {
	return {
		id: input.id,
		decoder_id: input.decoder_id,
		base_definition_id: input.base_definition_id,
		is_disabled: 0,
		patch_json: input.patch_json ?? '{}',
		created_at: input.created_at ?? '2026-01-01T00:00:00.000Z',
		updated_at: input.updated_at ?? '2026-01-01T00:00:00.000Z'
	};
}

type FlatNodeInput = Partial<EffectiveCvDefinitionFlatNode> & Pick<EffectiveCvDefinitionFlatNode, 'id' | 'type' | 'key'>;

function makeFlatNode(input: FlatNodeInput): EffectiveCvDefinitionFlatNode {
	return {
		id: input.id,
		ownerType: input.ownerType ?? 'family',
		ownerId: input.ownerId ?? 'family-1',
		parentId: input.parentId ?? null,
		sortOrder: input.sortOrder ?? 10,
		key: input.key,
		type: input.type,
		name: input.name ?? input.id,
		description: input.description ?? null,
		config: input.config ?? {},
		createdAt: input.createdAt ?? '2026-01-01T00:00:00.000Z',
		updatedAt: input.updatedAt ?? '2026-01-01T00:00:00.000Z'
	};
}

describe('validateConfigForType', () => {
	it('validates folder config', () => {
		expect(() => validateConfigForType('folder', {})).not.toThrow();
		expect(() => validateConfigForType('folder', { any: 'value' })).not.toThrow();
	});

	it('validates cv_number config with all required fields', () => {
		expect(() =>
			validateConfigForType('cv_number', {
				cv: 1,
				min: 0,
				max: 255,
				default: 10
			})
		).not.toThrow();
	});

	it('rejects cv_number config with missing cv field', () => {
		expect(() =>
			validateConfigForType('cv_number', {
				min: 0,
				max: 255
			})
		).toThrow('cv_number config.cv must be an number.');
	});

	it('validates cv_boolean config with all required fields', () => {
		expect(() =>
			validateConfigForType('cv_boolean', {
				cv: 3,
				bit: 7,
				default: true
			})
		).not.toThrow();
	});

	it('rejects cv_boolean config with invalid bit value', () => {
		expect(() =>
			validateConfigForType('cv_boolean', {
				cv: 3,
				bit: 9
			})
		).toThrow('cv_boolean config.bit muss zwischen 0 und 7 liegen.');
	});

	it('validates cv_select config with all required fields', () => {
		expect(() =>
			validateConfigForType('cv_select', {
				cv: 29,
				options: [
					{ value: 0, label: 'Off' },
					{ value: 1, label: 'On' }
				],
				default: 0
			})
		).not.toThrow();
	});

	it('rejects cv_select config with missing options array', () => {
		expect(() =>
			validateConfigForType('cv_select', {
				cv: 29
			})
		).toThrow('cv_select config.options muss ein Array sein.');
	});
});

describe('indexRowsById', () => {
	it('returns empty map for empty array', () => {
		const result = indexRowsById([]);
		expect(result.size).toBe(0);
	});

	it('indexes single row by id', () => {
		const rows = [makeRow({ id: 'row-1', type: 'folder' })];
		const result = indexRowsById(rows);

		expect(result.size).toBe(1);
		expect(result.get('row-1')).toEqual(rows[0]);
	});

	it('indexes multiple rows by id', () => {
		const rows = [
			makeRow({ id: 'row-1', type: 'folder' }),
			makeRow({ id: 'row-2', type: 'cv_number', config_json: JSON.stringify({ cv: 1, min: 0, max: 255 }) }),
			makeRow({ id: 'row-3', type: 'cv_boolean', config_json: JSON.stringify({ cv: 1, bit: 0 }) })
		];
		const result = indexRowsById(rows);

		expect(result.size).toBe(3);
		expect(result.get('row-1')).toEqual(rows[0]);
		expect(result.get('row-2')).toEqual(rows[1]);
		expect(result.get('row-3')).toEqual(rows[2]);
	});

	it('rejects duplicate ids in same array', () => {
		const rows = [
			makeRow({ id: 'row-1', type: 'folder' }),
			makeRow({ id: 'row-1', type: 'cv_number', config_json: JSON.stringify({ cv: 1, min: 0, max: 255 }) })
		];

		expect(() => indexRowsById(rows)).toThrow('Doppelte CV-Definition-ID in Basisdaten: "row-1".');
	});
});

describe('validateOverrideRows', () => {
	const familyRows = [
		makeRow({ id: 'base-1', type: 'cv_number', config_json: JSON.stringify({ cv: 1, min: 0, max: 255 }) }),
		makeRow({ id: 'base-2', type: 'cv_boolean', config_json: JSON.stringify({ cv: 1, bit: 0 }) })
	];

	it('accepts valid override rows', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ name: 'Updated Name' })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).not.toThrow();
	});

	it('rejects override with mismatched decoder_id', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-2',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ name: 'Updated' })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override "override-1" gehört zu Decoder "decoder-2", erwartet war "decoder-1".'
		);
	});

	it('rejects override referencing non-existent base definition', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'non-existent',
				patch_json: JSON.stringify({ name: 'Updated' })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override "override-1" verweist auf Base-Definition "non-existent", die nicht zur Decoder-Familie gehört.'
		);
	});

	it('rejects override with invalid JSON in patch', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: 'invalid json'
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override "override-1" enthält ungültiges JSON in patch_json.'
		);
	});

	it('accepts override with valid name patch', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ name: 'New Name' })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).not.toThrow();
	});

	it('rejects override patch with invalid name field type', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ name: 123 })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override-Patch "base-1": name muss ein String sein.'
		);
	});

	it('accepts override patch with null description', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ description: null })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).not.toThrow();
	});

	it('rejects override patch with invalid description type', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ description: 123 })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override-Patch "base-1": description muss String oder null sein.'
		);
	});

	it('accepts override patch with sortOrder', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ sortOrder: 42 })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).not.toThrow();
	});

	it('rejects override patch with invalid sortOrder type', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ sortOrder: 'invalid' })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override-Patch "base-1": sortOrder muss eine Zahl sein.'
		);
	});

	it('rejects override patch with disallowed field', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ invalidField: 'value' })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override-Patch für Base-Definition "base-1" enthält nicht erlaubtes Feld "invalidField".'
		);
	});

	it('rejects override patch with non-object structure', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify('not an object')
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow(
			'Override-Patch für Base-Definition "base-1" muss ein Objekt sein.'
		);
	});

	it('accepts override patch that merges config for cv_number', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ config: { default: 100 } })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).not.toThrow();
	});

	it('rejects override patch with invalid config merge', () => {
		const overrides = [
			makeOverride({
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				patch_json: JSON.stringify({ config: { min: 'invalid' } })
			})
		];

		expect(() => validateOverrideRows(familyRows, 'decoder-1', overrides)).toThrow();
	});
});

describe('validateDecoderRows', () => {
	it('accepts valid decoder rows', () => {
		const rows = [
			makeRow({
				id: 'dec-1',
				type: 'cv_number',
				owner_type: 'decoder',
				owner_id: 'decoder-1',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			})
		];

		expect(() => validateDecoderRows(rows, 'decoder-1')).not.toThrow();
	});

	it('rejects row with wrong owner_type', () => {
		const rows = [
			makeRow({
				id: 'dec-1',
				type: 'cv_number',
				owner_type: 'family',
				owner_id: 'decoder-1',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			})
		];

		expect(() => validateDecoderRows(rows, 'decoder-1')).toThrow(
			'CV-Definition "dec-1" ist keine Decoder-Definition, owner_type="family".'
		);
	});

	it('rejects row with wrong owner_id', () => {
		const rows = [
			makeRow({
				id: 'dec-1',
				type: 'cv_number',
				owner_type: 'decoder',
				owner_id: 'decoder-2',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			})
		];

		expect(() => validateDecoderRows(rows, 'decoder-1')).toThrow(
			'CV-Definition "dec-1" gehört zu Decoder "decoder-2", erwartet war "decoder-1".'
		);
	});

	it('rejects row with invalid config for type', () => {
		const rows = [
			makeRow({
				id: 'dec-1',
				type: 'cv_number',
				owner_type: 'decoder',
				owner_id: 'decoder-1',
				config_json: JSON.stringify({ cv: 1, min: 0 })
			})
		];

		expect(() => validateDecoderRows(rows, 'decoder-1')).toThrow('cv_number config.max must be an number.');
	});

	it('rejects row with invalid JSON config', () => {
		const rows = [
			makeRow({
				id: 'dec-1',
				type: 'cv_number',
				owner_type: 'decoder',
				owner_id: 'decoder-1',
				config_json: 'invalid json'
			})
		];

		expect(() => validateDecoderRows(rows, 'decoder-1')).toThrow('CV-Definition "dec-1" enthält ungültiges JSON in config_json.');
	});

	it('validates multiple decoder rows', () => {
		const rows = [
			makeRow({
				id: 'dec-1',
				type: 'cv_number',
				owner_type: 'decoder',
				owner_id: 'decoder-1',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			}),
			makeRow({
				id: 'dec-2',
				type: 'cv_boolean',
				owner_type: 'decoder',
				owner_id: 'decoder-1',
				config_json: JSON.stringify({ cv: 1, bit: 0 })
			})
		];

		expect(() => validateDecoderRows(rows, 'decoder-1')).not.toThrow();
	});
});

describe('validateEffectiveFlatNodes', () => {
	it('accepts empty node array', () => {
		expect(() => validateEffectiveFlatNodes([])).not.toThrow();
	});

	it('accepts valid single node', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'root',
				config: {}
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).not.toThrow();
	});

	it('accepts valid parent-child hierarchy', () => {
		const nodes = [
			makeFlatNode({
				id: 'parent-1',
				type: 'folder',
				key: 'settings',
				config: {}
			}),
			makeFlatNode({
				id: 'child-1',
				type: 'cv_number',
				key: 'settings.speed',
				parentId: 'parent-1',
				config: { cv: 1, min: 0, max: 255 }
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).not.toThrow();
	});

	it('rejects duplicate node ids', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'root1',
				config: {}
			}),
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'root2',
				config: {}
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow('Doppelte effektive CV-Definition-ID: "node-1".');
	});

	it('rejects duplicate keys', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'settings',
				config: {}
			}),
			makeFlatNode({
				id: 'node-2',
				type: 'folder',
				key: 'settings',
				config: {}
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow('Doppelter effektiver CV-Definition-Key: "settings".');
	});

	it('rejects node referencing non-existent parent', () => {
		const nodes = [
			makeFlatNode({
				id: 'child-1',
				type: 'cv_number',
				key: 'speed',
				parentId: 'non-existent',
				config: { cv: 1, min: 0, max: 255 }
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow(
			'Effektive CV-Definition "child-1" verweist auf unbekannten Parent "non-existent".'
		);
	});

	it('rejects node with non-folder parent', () => {
		const nodes = [
			makeFlatNode({
				id: 'parent-1',
				type: 'cv_number',
				key: 'speed',
				config: { cv: 1, min: 0, max: 255 }
			}),
			makeFlatNode({
				id: 'child-1',
				type: 'cv_boolean',
				key: 'speed.bit',
				parentId: 'parent-1',
				config: { cv: 1, bit: 0 }
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow(
			'Effektive CV-Definition "child-1" hat Parent "parent-1", aber Parent ist kein folder.'
		);
	});

	it('rejects simple cycle where child references parent as parent', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'root',
				parentId: 'node-1',
				config: {}
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow('Zyklus in CV-Definitionen erkannt bei "node-1".');
	});

	it('rejects deep cycle in parent chain', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'a',
				parentId: 'node-2',
				config: {}
			}),
			makeFlatNode({
				id: 'node-2',
				type: 'folder',
				key: 'b',
				parentId: 'node-3',
				config: {}
			}),
			makeFlatNode({
				id: 'node-3',
				type: 'folder',
				key: 'c',
				parentId: 'node-1',
				config: {}
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow('Zyklus in CV-Definitionen erkannt');
	});

	it('validates config for all node types', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'folder',
				key: 'root',
				config: {}
			}),
			makeFlatNode({
				id: 'node-2',
				type: 'cv_number',
				key: 'speed',
				config: { cv: 1, min: 0, max: 255 }
			}),
			makeFlatNode({
				id: 'node-3',
				type: 'cv_boolean',
				key: 'enabled',
				config: { cv: 1, bit: 0 }
			}),
			makeFlatNode({
				id: 'node-4',
				type: 'cv_select',
				key: 'mode',
				config: {
					cv: 2,
					options: [
						{ value: 0, label: 'Off' },
						{ value: 1, label: 'On' }
					]
				}
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).not.toThrow();
	});

	it('rejects node with invalid config', () => {
		const nodes = [
			makeFlatNode({
				id: 'node-1',
				type: 'cv_number',
				key: 'speed',
				config: JSON.parse('{"cv":1,"min":0,"max":"255"}')
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).toThrow('cv_number config.max must be an number.');
	});

	it('accepts complex hierarchy without cycles', () => {
		const nodes = [
			makeFlatNode({
				id: 'root',
				type: 'folder',
				key: 'settings',
				config: {}
			}),
			makeFlatNode({
				id: 'folder-1',
				type: 'folder',
				key: 'settings.motor',
				parentId: 'root',
				config: {}
			}),
			makeFlatNode({
				id: 'cv-1',
				type: 'cv_number',
				key: 'settings.motor.speed',
				parentId: 'folder-1',
				config: { cv: 1, min: 0, max: 255 }
			}),
			makeFlatNode({
				id: 'folder-2',
				type: 'folder',
				key: 'settings.lights',
				parentId: 'root',
				config: {}
			}),
			makeFlatNode({
				id: 'cv-2',
				type: 'cv_boolean',
				key: 'settings.lights.enabled',
				parentId: 'folder-2',
				config: { cv: 2, bit: 0 }
			})
		];

		expect(() => validateEffectiveFlatNodes(nodes)).not.toThrow();
	});
});
