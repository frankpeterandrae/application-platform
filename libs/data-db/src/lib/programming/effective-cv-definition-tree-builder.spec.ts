/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';
import { buildEffectiveCvDefinitionTree } from './effective-cv-definition-tree-builder';

type FlatInput = Partial<EffectiveCvDefinitionFlatNode> & Pick<EffectiveCvDefinitionFlatNode, 'id' | 'type'>;

function makeFlatNode(input: FlatInput): EffectiveCvDefinitionFlatNode {
	return {
		id: input.id,
		ownerType: input.ownerType ?? 'family',
		ownerId: input.ownerId ?? 'family-1',
		parentId: input.parentId ?? null,
		sortOrder: input.sortOrder ?? 10,
		key: input.key ?? input.id,
		type: input.type,
		name: input.name ?? input.id,
		description: input.description ?? null,
		config: input.config ?? {},
		createdAt: input.createdAt ?? '2026-01-01T00:00:00.000Z',
		updatedAt: input.updatedAt ?? '2026-01-01T00:00:00.000Z'
	};
}

describe('buildEffectiveCvDefinitionTree', () => {
	it('returns empty array when given empty input', () => {
		const result = buildEffectiveCvDefinitionTree([]);

		expect(result).toEqual([]);
	});

	it('creates tree with single root node without children', () => {
		const flat = [makeFlatNode({ id: 'root-1', type: 'folder' })];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree).toHaveLength(1);
		expect(tree[0]?.id).toBe('root-1');
		expect(tree[0]?.children).toEqual([]);
	});

	it('creates multiple root nodes at same level', () => {
		const flat = [makeFlatNode({ id: 'root-1', type: 'folder' }), makeFlatNode({ id: 'root-2', type: 'folder' })];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree).toHaveLength(2);
		expect(tree.map((n) => n.id)).toEqual(['root-1', 'root-2']);
	});

	it('creates nested tree structure with single level of children', () => {
		const flat = [
			makeFlatNode({ id: 'root', type: 'folder' }),
			makeFlatNode({ id: 'child-1', type: 'cv_number', parentId: 'root' }),
			makeFlatNode({ id: 'child-2', type: 'cv_select', parentId: 'root' })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree).toHaveLength(1);
		expect(tree[0]?.id).toBe('root');
		expect(tree[0]?.children).toHaveLength(2);
		expect(tree[0]?.children.map((c) => c.id)).toEqual(['child-1', 'child-2']);
	});

	it('creates deeply nested tree with multiple levels', () => {
		const flat = [
			makeFlatNode({ id: 'root', type: 'folder' }),
			makeFlatNode({ id: 'level-1', type: 'folder', parentId: 'root' }),
			makeFlatNode({ id: 'level-2', type: 'folder', parentId: 'level-1' }),
			makeFlatNode({ id: 'leaf', type: 'cv_number', parentId: 'level-2' })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.children[0]?.children[0]?.id).toBe('level-2');
		expect(tree[0]?.children[0]?.children[0]?.children[0]?.id).toBe('leaf');
	});

	it('sorts root nodes by sortOrder ascending', () => {
		const flat = [
			makeFlatNode({ id: 'root-1', type: 'folder', sortOrder: 30 }),
			makeFlatNode({ id: 'root-2', type: 'folder', sortOrder: 10 }),
			makeFlatNode({ id: 'root-3', type: 'folder', sortOrder: 20 })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree.map((n) => n.id)).toEqual(['root-2', 'root-3', 'root-1']);
	});

	it('sorts children by sortOrder when same sortOrder as siblings', () => {
		const flat = [
			makeFlatNode({ id: 'root', type: 'folder' }),
			makeFlatNode({ id: 'child-1', type: 'cv_number', parentId: 'root', sortOrder: 30 }),
			makeFlatNode({ id: 'child-2', type: 'cv_select', parentId: 'root', sortOrder: 10 }),
			makeFlatNode({ id: 'child-3', type: 'cv_boolean', parentId: 'root', sortOrder: 20 })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.children.map((c) => c.id)).toEqual(['child-2', 'child-3', 'child-1']);
	});

	it('sorts nodes with same sortOrder by localized name in German', () => {
		const flat = [
			makeFlatNode({ id: 'root', type: 'folder' }),
			makeFlatNode({ id: 'zebra', type: 'cv_number', parentId: 'root', sortOrder: 10, name: 'Zebra' }),
			makeFlatNode({ id: 'apple', type: 'cv_select', parentId: 'root', sortOrder: 10, name: 'Apple' }),
			makeFlatNode({ id: 'banana', type: 'cv_boolean', parentId: 'root', sortOrder: 10, name: 'Banana' })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.children.map((c) => c.id)).toEqual(['apple', 'banana', 'zebra']);
	});

	it('sorts by sortOrder first then name when combined', () => {
		const flat = [
			makeFlatNode({ id: 'root', type: 'folder' }),
			makeFlatNode({ id: 'a-sort-20', type: 'cv_number', parentId: 'root', sortOrder: 20, name: 'A' }),
			makeFlatNode({ id: 'z-sort-10', type: 'cv_select', parentId: 'root', sortOrder: 10, name: 'Z' }),
			makeFlatNode({ id: 'b-sort-20', type: 'cv_boolean', parentId: 'root', sortOrder: 20, name: 'B' })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.children.map((c) => c.id)).toEqual(['z-sort-10', 'a-sort-20', 'b-sort-20']);
	});

	it('preserves all node properties when building tree', () => {
		const config = { cv: 1, min: 0, max: 255, default: 100 };
		const flat = [
			makeFlatNode({
				id: 'test-node',
				type: 'cv_number',
				ownerType: 'decoder',
				ownerId: 'decoder-42',
				sortOrder: 25,
				key: 'my-key',
				name: 'My Node',
				description: 'A test node',
				config,
				createdAt: '2026-02-15T10:30:00.000Z',
				updatedAt: '2026-02-20T14:45:00.000Z'
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]).toEqual({
			id: 'test-node',
			ownerType: 'decoder',
			ownerId: 'decoder-42',
			parentId: null,
			sortOrder: 25,
			key: 'my-key',
			type: 'cv_number',
			name: 'My Node',
			description: 'A test node',
			config,
			createdAt: '2026-02-15T10:30:00.000Z',
			updatedAt: '2026-02-20T14:45:00.000Z',
			children: []
		});
	});

	it('deep clones config to prevent reference sharing', () => {
		const configOriginal = { cv: 1, min: 0, max: 255 };
		const flat = [
			makeFlatNode({
				id: 'node-1',
				type: 'cv_number',
				config: configOriginal
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);
		const configInTree = tree[0]?.config as typeof configOriginal;

		configInTree.min = 100;

		expect(configOriginal.min).toBe(0);
	});

	it('deep clones nested config objects', () => {
		const configOriginal = {
			cv: 29,
			options: [
				{ value: 0, label: 'Off' },
				{ value: 1, label: 'On' }
			]
		};
		const flat = [
			makeFlatNode({
				id: 'node-1',
				type: 'cv_select',
				config: configOriginal
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);
		const configInTree = tree[0]?.config as typeof configOriginal;

		configInTree.options[0]!.label = 'Modified';

		expect(configOriginal.options[0]!.label).toBe('Off');
	});

	it('throws when child references non-existent parent', () => {
		const flat = [
			makeFlatNode({
				id: 'orphan',
				type: 'cv_number',
				parentId: 'does-not-exist'
			})
		];

		expect(() => buildEffectiveCvDefinitionTree(flat)).toThrow(
			'Effektive CV-Definition "orphan" verweist auf unbekannten Parent "does-not-exist".'
		);
	});

	it('throws when parent is not a folder type', () => {
		const flat = [
			makeFlatNode({ id: 'parent-cv', type: 'cv_number' }),
			makeFlatNode({
				id: 'child',
				type: 'cv_boolean',
				parentId: 'parent-cv'
			})
		];

		expect(() => buildEffectiveCvDefinitionTree(flat)).toThrow(
			'Effektive CV-Definition "child" hat Parent "parent-cv", aber Parent ist kein folder.'
		);
	});

	it('allows multiple children under same folder', () => {
		const flat = [
			makeFlatNode({ id: 'folder', type: 'folder' }),
			makeFlatNode({ id: 'child-1', type: 'cv_number', parentId: 'folder' }),
			makeFlatNode({ id: 'child-2', type: 'cv_select', parentId: 'folder' }),
			makeFlatNode({ id: 'child-3', type: 'cv_boolean', parentId: 'folder' })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.children).toHaveLength(3);
	});

	it('handles mixed root and nested nodes correctly', () => {
		const flat = [
			makeFlatNode({ id: 'root-1', type: 'folder', sortOrder: 1 }),
			makeFlatNode({ id: 'root-2', type: 'folder', sortOrder: 3 }),
			makeFlatNode({ id: 'child-1-1', type: 'cv_number', parentId: 'root-1', sortOrder: 1 }),
			makeFlatNode({ id: 'child-1-2', type: 'cv_select', parentId: 'root-1', sortOrder: 2 }),
			makeFlatNode({ id: 'child-2-1', type: 'cv_boolean', parentId: 'root-2', sortOrder: 1 })
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree.map((n) => n.id)).toEqual(['root-1', 'root-2']);
		expect(tree[0]?.children.map((c) => c.id)).toEqual(['child-1-1', 'child-1-2']);
		expect(tree[1]?.children.map((c) => c.id)).toEqual(['child-2-1']);
	});

	it('handles nodes with null description', () => {
		const flat = [
			makeFlatNode({
				id: 'node',
				type: 'folder',
				description: null
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.description).toBeNull();
	});

	it('handles nodes with description', () => {
		const flat = [
			makeFlatNode({
				id: 'node',
				type: 'folder',
				description: 'This is a description'
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.description).toBe('This is a description');
	});

	it('preserves parent-child relationships after sorting', () => {
		const flat = [
			makeFlatNode({ id: 'root', type: 'folder', sortOrder: 10 }),
			makeFlatNode({
				id: 'child-z',
				type: 'cv_number',
				parentId: 'root',
				sortOrder: 10,
				name: 'Z Name'
			}),
			makeFlatNode({
				id: 'child-a',
				type: 'cv_select',
				parentId: 'root',
				sortOrder: 10,
				name: 'A Name'
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.children[0]?.parentId).toBe('root');
		expect(tree[0]?.children[1]?.parentId).toBe('root');
		expect(tree[0]?.children.map((c) => c.id)).toEqual(['child-a', 'child-z']);
	});

	it('handles different owner types (family and decoder)', () => {
		const flat = [
			makeFlatNode({
				id: 'family-node',
				type: 'folder',
				ownerType: 'family',
				ownerId: 'family-1',
				sortOrder: 20
			}),
			makeFlatNode({
				id: 'decoder-node',
				type: 'cv_number',
				ownerType: 'decoder',
				ownerId: 'decoder-42',
				sortOrder: 10
			})
		];

		const tree = buildEffectiveCvDefinitionTree(flat);

		expect(tree[0]?.ownerType).toBe('decoder');
		expect(tree[1]?.ownerType).toBe('family');
	});
});
