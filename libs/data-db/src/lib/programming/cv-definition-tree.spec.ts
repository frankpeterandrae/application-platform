/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionRow } from '../repos/programming/cv-definitions.repo';

import { buildCvDefinitionTree, mapCvDefinitionRowToNode } from './cv-definition-tree';

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

describe('mapCvDefinitionRowToNode', () => {
	it('maps all fields and parses typed config for cv_number rows', () => {
		const row = makeRow({
			id: 'cv-1',
			type: 'cv_number',
			owner_type: 'decoder',
			owner_id: 'decoder-1',
			parent_id: 'root-1',
			sort_order: 42,
			key: 'speed',
			name: 'Speed',
			description: 'Speed value',
			config_json: JSON.stringify({ cv: 1, min: 0, max: 255, default: 10 })
		});

		const node = mapCvDefinitionRowToNode(row);

		expect(node).toEqual({
			id: 'cv-1',
			ownerType: 'decoder',
			ownerId: 'decoder-1',
			parentId: 'root-1',
			sortOrder: 42,
			key: 'speed',
			type: 'cv_number',
			name: 'Speed',
			description: 'Speed value',
			config: { cv: 1, min: 0, max: 255, default: 10 },
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
			children: []
		});
	});

	it('throws when config JSON is invalid for the declared type', () => {
		const row = makeRow({
			id: 'cv-invalid',
			type: 'cv_boolean',
			config_json: JSON.stringify({ cv: 1, bit: 9 })
		});

		expect(() => mapCvDefinitionRowToNode(row)).toThrow('cv_boolean config.bit muss zwischen 0 und 7 liegen.');
	});
});

describe('buildCvDefinitionTree', () => {
	it('returns an empty tree when no rows are provided', () => {
		expect(buildCvDefinitionTree([])).toEqual([]);
	});

	it('builds a nested tree and sorts roots and children by sortOrder then name', () => {
		const rows: CvDefinitionRow[] = [
			makeRow({
				id: 'root-b',
				type: 'folder',
				sort_order: 20,
				name: 'B',
				config_json: '{}'
			}),
			makeRow({
				id: 'root-a',
				type: 'folder',
				sort_order: 20,
				name: 'A',
				config_json: '{}'
			}),
			makeRow({
				id: 'child-2',
				type: 'cv_select',
				parent_id: 'root-a',
				sort_order: 20,
				name: 'B',
				config_json: JSON.stringify({
					cv: 2,
					options: [
						{ value: 0, label: 'Off' },
						{ value: 1, label: 'On' }
					]
				})
			}),
			makeRow({
				id: 'child-1',
				type: 'cv_number',
				parent_id: 'root-a',
				sort_order: 10,
				name: 'A',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			})
		];

		const tree = buildCvDefinitionTree(rows);

		expect(tree.map((node) => node.id)).toEqual(['root-a', 'root-b']);
		expect(tree[0]?.children.map((node) => node.id)).toEqual(['child-1', 'child-2']);
		expect(tree[1]?.children).toEqual([]);
	});

	it('throws when a node references a missing parent', () => {
		const rows: CvDefinitionRow[] = [
			makeRow({
				id: 'orphan',
				type: 'cv_number',
				parent_id: 'does-not-exist',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			})
		];

		expect(() => buildCvDefinitionTree(rows)).toThrow('references missing parent "does-not-exist"');
	});

	it('throws when a node references a non-folder parent', () => {
		const rows: CvDefinitionRow[] = [
			makeRow({
				id: 'parent-cv',
				type: 'cv_number',
				config_json: JSON.stringify({ cv: 1, min: 0, max: 255 })
			}),
			makeRow({
				id: 'child',
				type: 'cv_boolean',
				parent_id: 'parent-cv',
				config_json: JSON.stringify({ cv: 2, bit: 1 })
			})
		];

		expect(() => buildCvDefinitionTree(rows)).toThrow('expected "folder"');
	});
});
