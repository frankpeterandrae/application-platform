/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { flattenCvDefinitionTree } from './cv-definition-flatten';
import type { CvDefinitionTreeNode } from './cv-definition-tree';

type NodeBaseInput = {
	id: string;
	parentId: string | null;
	sortOrder?: number;
	key?: string;
	name?: string;
	description?: string | null;
	children?: CvDefinitionTreeNode[];
};

function makeFolderNode(input: NodeBaseInput): CvDefinitionTreeNode {
	return {
		id: input.id,
		ownerType: 'family',
		ownerId: 'family-1',
		parentId: input.parentId,
		sortOrder: input.sortOrder ?? 10,
		key: input.key ?? input.id,
		type: 'folder',
		name: input.name ?? input.id,
		description: input.description ?? null,
		config: {},
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		children: input.children ?? []
	};
}

function makeNumberNode(input: NodeBaseInput): CvDefinitionTreeNode {
	return {
		id: input.id,
		ownerType: 'decoder',
		ownerId: 'decoder-1',
		parentId: input.parentId,
		sortOrder: input.sortOrder ?? 10,
		key: input.key ?? input.id,
		type: 'cv_number',
		name: input.name ?? input.id,
		description: input.description ?? null,
		config: {
			cv: 1,
			min: 0,
			max: 255,
			default: 10
		},
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		children: input.children ?? []
	};
}

describe('flattenCvDefinitionTree', () => {
	it('returns an empty list when no root nodes are provided', () => {
		expect(flattenCvDefinitionTree([])).toEqual([]);
	});

	it('flattens nodes in preorder across nested children and multiple roots', () => {
		const tree: CvDefinitionTreeNode[] = [
			makeFolderNode({
				id: 'root-a',
				parentId: null,
				children: [
					makeNumberNode({ id: 'child-a1', parentId: 'root-a' }),
					makeFolderNode({
						id: 'child-a2',
						parentId: 'root-a',
						children: [makeNumberNode({ id: 'grandchild-a2-1', parentId: 'child-a2' })]
					})
				]
			}),
			makeNumberNode({ id: 'root-b', parentId: null })
		];

		const result = flattenCvDefinitionTree(tree);

		expect(result.map((node) => node.id)).toEqual(['root-a', 'child-a1', 'child-a2', 'grandchild-a2-1', 'root-b']);
	});

	it('maps all public node fields into the flat representation', () => {
		const tree: CvDefinitionTreeNode[] = [
			makeNumberNode({
				id: 'n-1',
				parentId: 'p-1',
				sortOrder: 42,
				key: 'speed-step',
				name: 'Speed Step',
				description: 'Sets speed'
			})
		];

		const [flatNode] = flattenCvDefinitionTree(tree);

		expect(flatNode).toEqual({
			id: 'n-1',
			ownerType: 'decoder',
			ownerId: 'decoder-1',
			parentId: 'p-1',
			sortOrder: 42,
			key: 'speed-step',
			type: 'cv_number',
			name: 'Speed Step',
			description: 'Sets speed',
			config: {
				cv: 1,
				min: 0,
				max: 255,
				default: 10
			},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		});
		expect('children' in flatNode).toBe(false);
	});
});
