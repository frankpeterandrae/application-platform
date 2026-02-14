/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '../../db';

import {
	createCvDefinitionOverride,
	deleteCvDefinitionOverrideRow,
	getCvDefinitionOverrideById,
	listCvDefinitionOverridesByBaseDefinition,
	listCvDefinitionOverridesByDecoder,
	updateCvDefinitionOverrideRow
} from './cv-definition-overrides.repo';

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

describe('createCvDefinitionOverride', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('inserts override with correct parameters when isDisabled is true', () => {
		const params = {
			id: 'override-1',
			decoderId: 'decoder-1',
			baseDefinitionId: 'base-def-1',
			isDisabled: true,
			patch: { name: 'Updated Name' }
		};

		createCvDefinitionOverride(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'override-1',
			'decoder-1',
			'base-def-1',
			1,
			JSON.stringify(params.patch),
			expect.any(String),
			expect.any(String)
		);
	});

	it('inserts override with is_disabled zero when isDisabled is false', () => {
		const params = {
			id: 'override-1',
			decoderId: 'decoder-1',
			baseDefinitionId: 'base-def-1',
			isDisabled: false,
			patch: { name: 'Updated Name' }
		};

		createCvDefinitionOverride(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'override-1',
			'decoder-1',
			'base-def-1',
			0,
			JSON.stringify(params.patch),
			expect.any(String),
			expect.any(String)
		);
	});

	it('inserts override with is_disabled zero when isDisabled is undefined', () => {
		const params = {
			id: 'override-1',
			decoderId: 'decoder-1',
			baseDefinitionId: 'base-def-1',
			patch: { description: 'Updated Description' }
		};

		createCvDefinitionOverride(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'override-1',
			'decoder-1',
			'base-def-1',
			0,
			expect.any(String),
			expect.any(String),
			expect.any(String)
		);
	});

	it('serializes patch object to JSON string', () => {
		const patch = { name: 'Test', sortOrder: 5 };
		const params = {
			id: 'override-1',
			decoderId: 'decoder-1',
			baseDefinitionId: 'base-def-1',
			patch
		};

		createCvDefinitionOverride(db, params);

		const callArgs = mockStatement.run.mock.calls[0];
		expect(callArgs[4]).toBe(JSON.stringify(patch));
	});

	it('uses ISO timestamp for created_at and updated_at', () => {
		const params = {
			id: 'override-1',
			decoderId: 'decoder-1',
			baseDefinitionId: 'base-def-1',
			patch: { name: 'Test' }
		};

		createCvDefinitionOverride(db, params);

		const callArgs = mockStatement.run.mock.calls[0];
		const createdAt = callArgs[5];
		const updatedAt = callArgs[6];

		expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(createdAt).toBe(updatedAt);
	});

	it('executes INSERT statement with correct SQL structure', () => {
		const params = {
			id: 'override-1',
			decoderId: 'decoder-1',
			baseDefinitionId: 'base-def-1',
			patch: { name: 'Test' }
		};

		createCvDefinitionOverride(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('INSERT INTO cv_definition_overrides');
		expect(sql).toContain('id');
		expect(sql).toContain('decoder_id');
		expect(sql).toContain('base_definition_id');
		expect(sql).toContain('is_disabled');
		expect(sql).toContain('patch_json');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});
});

describe('listCvDefinitionOverridesByDecoder', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns all overrides for the given decoder', () => {
		const overrides = [
			{
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-1',
				is_disabled: 0,
				patch_json: '{}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'override-2',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-2',
				is_disabled: 1,
				patch_json: '{}',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(overrides);

		const result = listCvDefinitionOverridesByDecoder(db, 'decoder-1');

		expect(result).toEqual(overrides);
	});

	it('filters overrides by decoder_id parameter', () => {
		mockStatement.all.mockReturnValue([]);

		listCvDefinitionOverridesByDecoder(db, 'decoder-42');

		expect(mockStatement.all).toHaveBeenCalledWith('decoder-42');
	});

	it('returns empty array when no overrides exist for decoder', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listCvDefinitionOverridesByDecoder(db, 'decoder-1');

		expect(result).toEqual([]);
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.all.mockReturnValue([]);

		listCvDefinitionOverridesByDecoder(db, 'decoder-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM cv_definition_overrides');
		expect(sql).toContain('WHERE decoder_id = ?');
	});
});

describe('updateCvDefinitionOverrideRow', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('updates override with is_disabled true when isDisabled is true', () => {
		const params = {
			id: 'override-1',
			isDisabled: true,
			patch: { name: 'Updated' }
		};

		updateCvDefinitionOverrideRow(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(1, JSON.stringify(params.patch), expect.any(String), 'override-1');
	});

	it('updates override with is_disabled zero when isDisabled is false', () => {
		const params = {
			id: 'override-1',
			isDisabled: false,
			patch: { name: 'Updated' }
		};

		updateCvDefinitionOverrideRow(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(0, JSON.stringify(params.patch), expect.any(String), 'override-1');
	});

	it('serializes patch to JSON string', () => {
		const patch = { name: 'New Name', sortOrder: 10 };
		const params = {
			id: 'override-1',
			isDisabled: false,
			patch
		};

		updateCvDefinitionOverrideRow(db, params);

		const callArgs = mockStatement.run.mock.calls[0];
		expect(callArgs[1]).toBe(JSON.stringify(patch));
	});

	it('updates updated_at with ISO timestamp', () => {
		const params = {
			id: 'override-1',
			isDisabled: false,
			patch: { name: 'Test' }
		};

		updateCvDefinitionOverrideRow(db, params);

		const callArgs = mockStatement.run.mock.calls[0];
		const updatedAt = callArgs[2];

		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	it('specifies correct override id in WHERE clause', () => {
		const params = {
			id: 'specific-override-id',
			isDisabled: false,
			patch: { name: 'Test' }
		};

		updateCvDefinitionOverrideRow(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(expect.any(Number), expect.any(String), expect.any(String), 'specific-override-id');
	});

	it('executes UPDATE statement with correct structure', () => {
		const params = {
			id: 'override-1',
			isDisabled: false,
			patch: { name: 'Test' }
		};

		updateCvDefinitionOverrideRow(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('UPDATE cv_definition_overrides');
		expect(sql).toContain('is_disabled = ?');
		expect(sql).toContain('patch_json = ?');
		expect(sql).toContain('updated_at = ?');
		expect(sql).toContain('WHERE id = ?');
	});
});

describe('deleteCvDefinitionOverrideRow', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('deletes override by id', () => {
		deleteCvDefinitionOverrideRow(db, 'override-1');

		expect(mockStatement.run).toHaveBeenCalledWith('override-1');
	});

	it('uses correct override id in WHERE clause', () => {
		deleteCvDefinitionOverrideRow(db, 'specific-id');

		expect(mockStatement.run).toHaveBeenCalledWith('specific-id');
	});

	it('executes DELETE statement with correct structure', () => {
		deleteCvDefinitionOverrideRow(db, 'override-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('DELETE FROM cv_definition_overrides');
		expect(sql).toContain('WHERE id = ?');
	});
});

describe('listCvDefinitionOverridesByBaseDefinition', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns all overrides for the given base definition', () => {
		const overrides = [
			{
				id: 'override-1',
				decoder_id: 'decoder-1',
				base_definition_id: 'base-def-1',
				is_disabled: 0,
				patch_json: '{}',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'override-2',
				decoder_id: 'decoder-2',
				base_definition_id: 'base-def-1',
				is_disabled: 0,
				patch_json: '{}',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(overrides);

		const result = listCvDefinitionOverridesByBaseDefinition(db, 'base-def-1');

		expect(result).toEqual(overrides);
	});

	it('filters overrides by base_definition_id parameter', () => {
		mockStatement.all.mockReturnValue([]);

		listCvDefinitionOverridesByBaseDefinition(db, 'base-def-42');

		expect(mockStatement.all).toHaveBeenCalledWith('base-def-42');
	});

	it('returns empty array when no overrides reference base definition', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listCvDefinitionOverridesByBaseDefinition(db, 'base-def-1');

		expect(result).toEqual([]);
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.all.mockReturnValue([]);

		listCvDefinitionOverridesByBaseDefinition(db, 'base-def-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM cv_definition_overrides');
		expect(sql).toContain('WHERE base_definition_id = ?');
	});
});

describe('getCvDefinitionOverrideById', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns override when found', () => {
		const override = {
			id: 'override-1',
			decoder_id: 'decoder-1',
			base_definition_id: 'base-def-1',
			is_disabled: 0,
			patch_json: '{"name":"Updated"}',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(override);

		const result = getCvDefinitionOverrideById(db, 'override-1');

		expect(result).toEqual(override);
	});

	it('returns null when override not found', () => {
		mockStatement.get.mockReturnValue(undefined);

		const result = getCvDefinitionOverrideById(db, 'non-existent');

		expect(result).toBeNull();
	});

	it('queries by correct id', () => {
		mockStatement.get.mockReturnValue(undefined);

		getCvDefinitionOverrideById(db, 'specific-id');

		expect(mockStatement.get).toHaveBeenCalledWith('specific-id');
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.get.mockReturnValue(undefined);

		getCvDefinitionOverrideById(db, 'override-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM cv_definition_overrides');
		expect(sql).toContain('WHERE id = ?');
	});

	it('selects all required columns', () => {
		mockStatement.get.mockReturnValue(undefined);

		getCvDefinitionOverrideById(db, 'override-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('id');
		expect(sql).toContain('decoder_id');
		expect(sql).toContain('base_definition_id');
		expect(sql).toContain('is_disabled');
		expect(sql).toContain('patch_json');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});
});
