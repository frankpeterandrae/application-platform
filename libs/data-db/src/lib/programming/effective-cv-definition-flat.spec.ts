/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectTypeOf } from 'vitest';

import type { CvDefinitionTreeNode } from './cv-definition-tree';
import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';

describe('EffectiveCvDefinitionFlatNode', () => {
	it('accepts a complete folder node shape', () => {
		const node: EffectiveCvDefinitionFlatNode = {
			id: 'node-1',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null,
			sortOrder: 10,
			key: 'root',
			type: 'folder',
			name: 'Root',
			description: null,
			config: {},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		};

		expect(node.ownerType).toBe('family');
		expect(node.parentId).toBeNull();
		expect(node.type).toBe('folder');
	});

	it('accepts a decoder node with typed select config', () => {
		const node: EffectiveCvDefinitionFlatNode = {
			id: 'node-2',
			ownerType: 'decoder',
			ownerId: 'decoder-1',
			parentId: 'node-1',
			sortOrder: 20,
			key: 'mode',
			type: 'cv_select',
			name: 'Mode',
			description: 'Decoder mode',
			config: {
				cv: 29,
				options: [
					{ value: 0, label: 'Off' },
					{ value: 1, label: 'On' }
				],
				default: 1
			},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		};

		expect(node.ownerType).toBe('decoder');
		expect(node.parentId).toBe('node-1');
		expect(node.type).toBe('cv_select');
	});

	it('rejects ownerType values outside family and decoder', () => {
		const invalidNode: EffectiveCvDefinitionFlatNode = {
			id: 'invalid-owner',
			// @ts-expect-error ownerType only allows family or decoder
			ownerType: 'manufacturer',
			ownerId: 'owner-1',
			parentId: null,
			sortOrder: 10,
			key: 'invalid',
			type: 'folder',
			name: 'Invalid',
			description: null,
			config: {},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		};

		expectTypeOf(invalidNode).toEqualTypeOf<EffectiveCvDefinitionFlatNode>();
	});

	it('rejects missing required fields', () => {
		// @ts-expect-error updatedAt is required
		const invalidNode: EffectiveCvDefinitionFlatNode = {
			id: 'missing-field',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null,
			sortOrder: 10,
			key: 'root',
			type: 'folder',
			name: 'Root',
			description: null,
			config: {},
			createdAt: '2026-01-01T00:00:00.000Z'
		};

		expectTypeOf(invalidNode).toEqualTypeOf<EffectiveCvDefinitionFlatNode>();
	});

	it('keeps type and config aligned with CvDefinitionTreeNode unions', () => {
		expectTypeOf<EffectiveCvDefinitionFlatNode['type']>().toEqualTypeOf<CvDefinitionTreeNode['type']>();
		expectTypeOf<EffectiveCvDefinitionFlatNode['config']>().toEqualTypeOf<CvDefinitionTreeNode['config']>();
	});
});
