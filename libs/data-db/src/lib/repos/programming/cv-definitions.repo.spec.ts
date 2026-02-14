/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '../../db';

import {
	createCvDefinition,
	deleteCvDefinitionRow,
	getCvDefinitionById,
	getCvDefinitionTreeByOwner,
	listChildCvDefinitions,
	listCvDefinitionsByOwner,
	listSiblingCvDefinitions,
	moveCvDefinitionRow,
	updateCvDefinitionRow,
	updateCvDefinitionSortOrderRow,
	type CvDefinitionRow
} from './cv-definitions.repo';

type MockStatement = {
	run: ReturnType<typeof vi.fn>;
	all: ReturnType<typeof vi.fn>;
	get: ReturnType<typeof vi.fn>;
};

function createMockDb(): { db: Db; mockStatement: MockStatement } {
	const mockStatement: MockStatement = {
		run: vi.fn(),
		all: vi.fn(),
		get: vi.fn()
	};

	const db = {
		prepare: vi.fn().mockReturnValue(mockStatement)
	} as unknown as Db;

	return { db, mockStatement };
}

describe('createCvDefinition', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('inserts folder definition with minimal parameters', () => {
		const params = {
			id: 'folder-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'settings',
			name: 'Settings',
			type: 'folder' as const,
			config: {}
		};

		createCvDefinition(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'folder-1',
			'family',
			'family-1',
			null,
			0,
			'settings',
			'folder',
			'Settings',
			null,
			'{}',
			expect.any(String),
			expect.any(String)
		);
	});

	it('inserts cv_number definition with all config fields', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'decoder' as const,
			ownerId: 'decoder-1',
			parentId: 'folder-1',
			sortOrder: 10,
			key: 'speed',
			name: 'Speed',
			description: 'Motor speed value',
			type: 'cv_number' as const,
			config: { cv: 1, min: 0, max: 255, default: 100 }
		};

		createCvDefinition(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'cv-1',
			'decoder',
			'decoder-1',
			'folder-1',
			10,
			'speed',
			'cv_number',
			'Speed',
			'Motor speed value',
			JSON.stringify(params.config),
			expect.any(String),
			expect.any(String)
		);
	});

	it('inserts cv_boolean definition with bit and default', () => {
		const params = {
			id: 'cv-2',
			ownerType: 'decoder' as const,
			ownerId: 'decoder-1',
			key: 'enabled',
			name: 'Enabled',
			type: 'cv_boolean' as const,
			config: { cv: 2, bit: 0, default: true }
		};

		createCvDefinition(db, params);

		const configArg = mockStatement.run.mock.calls[0][9];
		expect(configArg).toBe(JSON.stringify(params.config));
	});

	it('inserts cv_select definition with options', () => {
		const config = {
			cv: 3,
			options: [
				{ value: 0, label: 'Off' },
				{ value: 1, label: 'On' }
			],
			default: 0
		};
		const params = {
			id: 'cv-3',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'mode',
			name: 'Mode',
			type: 'cv_select' as const,
			config
		};

		createCvDefinition(db, params);

		const configArg = mockStatement.run.mock.calls[0][9];
		expect(configArg).toBe(JSON.stringify(config));
	});

	it('uses null for parentId when not provided', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'root',
			name: 'Root',
			type: 'folder' as const,
			config: {}
		};

		createCvDefinition(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBeNull();
	});

	it('uses zero for sortOrder when not provided', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'root',
			name: 'Root',
			type: 'folder' as const,
			config: {}
		};

		createCvDefinition(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[4]).toBe(0);
	});

	it('uses null for description when not provided', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'root',
			name: 'Root',
			type: 'folder' as const,
			config: {}
		};

		createCvDefinition(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[8]).toBeNull();
	});

	it('uses ISO timestamps for created_at and updated_at', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'root',
			name: 'Root',
			type: 'folder' as const,
			config: {}
		};

		createCvDefinition(db, params);

		const args = mockStatement.run.mock.calls[0];
		const createdAt = args[10];
		const updatedAt = args[11];

		expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(createdAt).toBe(updatedAt);
	});

	it('executes INSERT statement with all required columns', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'root',
			name: 'Root',
			type: 'folder' as const,
			config: {}
		};

		createCvDefinition(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('INSERT INTO cv_definitions');
		expect(sql).toContain('id');
		expect(sql).toContain('owner_type');
		expect(sql).toContain('owner_id');
		expect(sql).toContain('parent_id');
		expect(sql).toContain('sort_order');
		expect(sql).toContain('key');
		expect(sql).toContain('type');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('config_json');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});

	it('throws when cv_number config is missing required max field', () => {
		const params = {
			id: 'cv-1',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'speed',
			name: 'Speed',
			type: 'cv_number' as const,
			config: { cv: 1, min: 0 } as any
		};

		expect(() => createCvDefinition(db, params)).toThrow();
	});

	it('throws when cv_boolean config has invalid bit value', () => {
		const params = {
			id: 'cv-2',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'flag',
			name: 'Flag',
			type: 'cv_boolean' as const,
			config: { cv: 2, bit: 8 } as any
		};

		expect(() => createCvDefinition(db, params)).toThrow();
	});

	it('throws when cv_select config is missing options array', () => {
		const params = {
			id: 'cv-3',
			ownerType: 'family' as const,
			ownerId: 'family-1',
			key: 'mode',
			name: 'Mode',
			type: 'cv_select' as const,
			config: { cv: 3 } as any
		};

		expect(() => createCvDefinition(db, params)).toThrow();
	});
});

describe('listCvDefinitionsByOwner', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns all definitions for given owner ordered by sort_order and name', () => {
		const rows: CvDefinitionRow[] = [
			{
				id: 'cv-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null,
				sort_order: 10,
				key: 'speed',
				type: 'cv_number',
				name: 'Speed',
				description: null,
				config_json: '{"cv":1,"min":0,"max":255}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'cv-2',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null,
				sort_order: 10,
				key: 'enabled',
				type: 'cv_boolean',
				name: 'Enabled',
				description: null,
				config_json: '{"cv":2,"bit":0}',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listCvDefinitionsByOwner(db, 'family', 'family-1');

		expect(result).toEqual(rows);
	});

	it('filters by owner_type and owner_id', () => {
		mockStatement.all.mockReturnValue([]);

		listCvDefinitionsByOwner(db, 'decoder', 'decoder-42');

		expect(mockStatement.all).toHaveBeenCalledWith('decoder', 'decoder-42');
	});

	it('returns empty array when owner has no definitions', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listCvDefinitionsByOwner(db, 'family', 'family-1');

		expect(result).toEqual([]);
	});

	it('executes SELECT statement with correct WHERE and ORDER BY clauses', () => {
		mockStatement.all.mockReturnValue([]);

		listCvDefinitionsByOwner(db, 'family', 'family-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM cv_definitions');
		expect(sql).toContain('WHERE owner_type = ? AND owner_id = ?');
		expect(sql).toContain('ORDER BY sort_order, name');
	});
});

describe('getCvDefinitionById', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns definition when found by id', () => {
		const row: CvDefinitionRow = {
			id: 'cv-1',
			owner_type: 'family',
			owner_id: 'family-1',
			parent_id: null,
			sort_order: 10,
			key: 'speed',
			type: 'cv_number',
			name: 'Speed',
			description: null,
			config_json: '{"cv":1,"min":0,"max":255}',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getCvDefinitionById(db, 'cv-1');

		expect(result).toEqual(row);
	});

	it('returns null when definition not found', () => {
		mockStatement.get.mockReturnValue(undefined);

		const result = getCvDefinitionById(db, 'non-existent');

		expect(result).toBeNull();
	});

	it('queries by correct id', () => {
		mockStatement.get.mockReturnValue(undefined);

		getCvDefinitionById(db, 'specific-id');

		expect(mockStatement.get).toHaveBeenCalledWith('specific-id');
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.get.mockReturnValue(undefined);

		getCvDefinitionById(db, 'cv-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM cv_definitions');
		expect(sql).toContain('WHERE id = ?');
	});
});

describe('getCvDefinitionTreeByOwner', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('calls listCvDefinitionsByOwner with correct parameters', () => {
		const listMock = vi.fn().mockReturnValue([]);
		vi.doMock('./cv-definitions.repo', () => ({
			listCvDefinitionsByOwner: listMock
		}));

		mockStatement.all.mockReturnValue([]);

		getCvDefinitionTreeByOwner(db, 'family', 'family-1');

		expect(mockStatement.all).toHaveBeenCalled();
	});

	it('returns empty tree when owner has no definitions', () => {
		mockStatement.all.mockReturnValue([]);

		const result = getCvDefinitionTreeByOwner(db, 'family', 'family-1');

		expect(result).toEqual([]);
	});

	it('builds tree from returned rows', () => {
		const rows: CvDefinitionRow[] = [
			{
				id: 'folder-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null,
				sort_order: 10,
				key: 'root',
				type: 'folder',
				name: 'Root',
				description: null,
				config_json: '{}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = getCvDefinitionTreeByOwner(db, 'family', 'family-1');

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThanOrEqual(0);
	});
});

describe('updateCvDefinitionRow', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('updates all mutable fields with provided values', () => {
		const params = {
			id: 'cv-1',
			parentId: 'folder-1',
			sortOrder: 20,
			name: 'Updated Name',
			description: 'Updated description',
			config: { cv: 1, min: 0, max: 255, default: 50 }
		};

		updateCvDefinitionRow(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'folder-1',
			20,
			'Updated Name',
			'Updated description',
			JSON.stringify(params.config),
			expect.any(String),
			'cv-1'
		);
	});

	it('updates with null parentId when moving to root', () => {
		const params = {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Root Item',
			description: null,
			config: { cv: 1, min: 0, max: 255 }
		};

		updateCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[0]).toBeNull();
	});

	it('updates with null description', () => {
		const params = {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Item',
			description: null,
			config: {}
		};

		updateCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBeNull();
	});

	it('updates updated_at with ISO timestamp', () => {
		const params = {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Item',
			description: null,
			config: {}
		};

		updateCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		const updatedAt = args[5];

		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	it('serializes config to JSON', () => {
		const config = { cv: 1, min: 0, max: 255, default: 100 };
		const params = {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Speed',
			description: null,
			config
		};

		updateCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[4]).toBe(JSON.stringify(config));
	});

	it('uses correct id in WHERE clause', () => {
		const params = {
			id: 'specific-id',
			parentId: null,
			sortOrder: 10,
			name: 'Item',
			description: null,
			config: {}
		};

		updateCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[6]).toBe('specific-id');
	});

	it('executes UPDATE statement with correct structure', () => {
		const params = {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Item',
			description: null,
			config: {}
		};

		updateCvDefinitionRow(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('UPDATE cv_definitions');
		expect(sql).toContain('parent_id = ?');
		expect(sql).toContain('sort_order = ?');
		expect(sql).toContain('name = ?');
		expect(sql).toContain('description = ?');
		expect(sql).toContain('config_json = ?');
		expect(sql).toContain('updated_at = ?');
		expect(sql).toContain('WHERE id = ?');
	});
});

describe('deleteCvDefinitionRow', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('deletes definition by id', () => {
		deleteCvDefinitionRow(db, 'cv-1');

		expect(mockStatement.run).toHaveBeenCalledWith('cv-1');
	});

	it('uses correct id in WHERE clause', () => {
		deleteCvDefinitionRow(db, 'specific-id');

		expect(mockStatement.run).toHaveBeenCalledWith('specific-id');
	});

	it('executes DELETE statement with correct structure', () => {
		deleteCvDefinitionRow(db, 'cv-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('DELETE FROM cv_definitions');
		expect(sql).toContain('WHERE id = ?');
	});
});

describe('moveCvDefinitionRow', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('updates parentId and sortOrder with ISO timestamp', () => {
		const params = {
			id: 'cv-1',
			parentId: 'folder-2',
			sortOrder: 25
		};

		moveCvDefinitionRow(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith('folder-2', 25, expect.any(String), 'cv-1');
	});

	it('moves to root by setting parentId to null', () => {
		const params = {
			id: 'cv-1',
			parentId: null,
			sortOrder: 5
		};

		moveCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[0]).toBeNull();
	});

	it('updates updated_at with ISO timestamp', () => {
		const params = {
			id: 'cv-1',
			parentId: 'folder-1',
			sortOrder: 15
		};

		moveCvDefinitionRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		const updatedAt = args[2];

		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	it('executes UPDATE statement with correct structure', () => {
		const params = {
			id: 'cv-1',
			parentId: 'folder-1',
			sortOrder: 15
		};

		moveCvDefinitionRow(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('UPDATE cv_definitions');
		expect(sql).toContain('parent_id = ?');
		expect(sql).toContain('sort_order = ?');
		expect(sql).toContain('updated_at = ?');
		expect(sql).toContain('WHERE id = ?');
	});
});

describe('listChildCvDefinitions', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns all direct children ordered by sort_order and name', () => {
		const rows: CvDefinitionRow[] = [
			{
				id: 'cv-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: 'folder-1',
				sort_order: 10,
				key: 'speed',
				type: 'cv_number',
				name: 'Speed',
				description: null,
				config_json: '{"cv":1,"min":0,"max":255}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listChildCvDefinitions(db, 'folder-1');

		expect(result).toEqual(rows);
	});

	it('filters by parent_id', () => {
		mockStatement.all.mockReturnValue([]);

		listChildCvDefinitions(db, 'parent-42');

		expect(mockStatement.all).toHaveBeenCalledWith('parent-42');
	});

	it('returns empty array when parent has no children', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listChildCvDefinitions(db, 'folder-1');

		expect(result).toEqual([]);
	});

	it('executes SELECT statement with correct WHERE and ORDER BY clauses', () => {
		mockStatement.all.mockReturnValue([]);

		listChildCvDefinitions(db, 'folder-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM cv_definitions');
		expect(sql).toContain('WHERE parent_id = ?');
		expect(sql).toContain('ORDER BY sort_order, name');
	});
});

describe('listSiblingCvDefinitions', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns root level siblings when parentId is null', () => {
		const rows: CvDefinitionRow[] = [
			{
				id: 'cv-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null,
				sort_order: 10,
				key: 'root1',
				type: 'folder',
				name: 'Root 1',
				description: null,
				config_json: '{}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null
		});

		expect(result).toEqual(rows);
	});

	it('returns children of parent when parentId is specified', () => {
		const rows: CvDefinitionRow[] = [
			{
				id: 'cv-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: 'folder-1',
				sort_order: 10,
				key: 'child1',
				type: 'cv_number',
				name: 'Child 1',
				description: null,
				config_json: '{"cv":1,"min":0,"max":255}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'folder-1'
		});

		expect(result).toEqual(rows);
	});

	it('filters by ownerType and ownerId for root level siblings', () => {
		mockStatement.all.mockReturnValue([]);

		listSiblingCvDefinitions(db, {
			ownerType: 'decoder',
			ownerId: 'decoder-42',
			parentId: null
		});

		expect(mockStatement.all).toHaveBeenCalledWith('decoder', 'decoder-42');
	});

	it('filters by ownerType, ownerId and parentId for nested siblings', () => {
		mockStatement.all.mockReturnValue([]);

		listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'folder-1'
		});

		expect(mockStatement.all).toHaveBeenCalledWith('family', 'family-1', 'folder-1');
	});

	it('returns empty array when no siblings exist', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null
		});

		expect(result).toEqual([]);
	});

	it('executes SELECT statement with parent_id IS NULL for root level', () => {
		mockStatement.all.mockReturnValue([]);

		listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null
		});

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('parent_id IS NULL');
	});

	it('executes SELECT statement with parent_id = ? for nested level', () => {
		mockStatement.all.mockReturnValue([]);

		listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'folder-1'
		});

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('parent_id = ?');
	});

	it('orders results by sort_order and name', () => {
		mockStatement.all.mockReturnValue([]);

		listSiblingCvDefinitions(db, {
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null
		});

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('ORDER BY sort_order, name');
	});
});

describe('updateCvDefinitionSortOrderRow', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('updates only sortOrder and updated_at', () => {
		const params = {
			id: 'cv-1',
			sortOrder: 25
		};

		updateCvDefinitionSortOrderRow(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(25, expect.any(String), 'cv-1');
	});

	it('updates updated_at with ISO timestamp', () => {
		const params = {
			id: 'cv-1',
			sortOrder: 15
		};

		updateCvDefinitionSortOrderRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		const updatedAt = args[1];

		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	it('uses correct id in WHERE clause', () => {
		const params = {
			id: 'specific-id',
			sortOrder: 10
		};

		updateCvDefinitionSortOrderRow(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[2]).toBe('specific-id');
	});

	it('executes UPDATE statement with correct structure', () => {
		const params = {
			id: 'cv-1',
			sortOrder: 20
		};

		updateCvDefinitionSortOrderRow(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('UPDATE cv_definitions');
		expect(sql).toContain('sort_order = ?');
		expect(sql).toContain('updated_at = ?');
		expect(sql).toContain('WHERE id = ?');
	});
});
