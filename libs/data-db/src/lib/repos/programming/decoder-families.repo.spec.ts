/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '../../db';

import { createDecoderFamily, getDecoderFamilyById, listDecoderFamiliesByManufacturer, type DecoderFamily } from './decoder-families.repo';

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

describe('createDecoderFamily', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('inserts family with all required parameters', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'manufacturer-1',
			name: 'Family Name',
			description: 'Family description'
		};

		createDecoderFamily(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'family-1',
			'manufacturer-1',
			'Family Name',
			'Family description',
			expect.any(String),
			expect.any(String)
		);
	});

	it('inserts family with null description when not provided', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'manufacturer-1',
			name: 'Family Name'
		};

		createDecoderFamily(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBeUndefined();
	});

	it('inserts family with provided description string', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'manufacturer-1',
			name: 'Family Name',
			description: 'Custom description'
		};

		createDecoderFamily(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBe('Custom description');
	});

	it('uses ISO timestamp for created_at and updated_at', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'manufacturer-1',
			name: 'Family Name'
		};

		createDecoderFamily(db, params);

		const args = mockStatement.run.mock.calls[0];
		const createdAt = args[4];
		const updatedAt = args[5];

		expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(createdAt).toBe(updatedAt);
	});

	it('executes INSERT statement with correct SQL structure', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'manufacturer-1',
			name: 'Test Family'
		};

		createDecoderFamily(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0] as string;

		expect(sql).toContain('INSERT INTO');
		expect(sql).toContain('decoder_families');
		expect(sql).toContain('id');
		expect(sql).toContain('manufacturer_id');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
		expect(sql).toContain('VALUES');
	});

	it('uses correct family id parameter', () => {
		const params = {
			id: 'specific-family-id',
			manufacturerId: 'manufacturer-1',
			name: 'Family'
		};

		createDecoderFamily(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[0]).toBe('specific-family-id');
	});

	it('uses correct manufacturer id parameter', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'specific-manufacturer-id',
			name: 'Family'
		};

		createDecoderFamily(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[1]).toBe('specific-manufacturer-id');
	});

	it('uses correct family name parameter', () => {
		const params = {
			id: 'family-1',
			manufacturerId: 'manufacturer-1',
			name: 'Custom Family Name'
		};

		createDecoderFamily(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[2]).toBe('Custom Family Name');
	});
});

describe('listDecoderFamiliesByManufacturer', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns all families for the given manufacturer', () => {
		const rows: DecoderFamily[] = [
			{
				id: 'family-1',
				manufacturer_id: 'manufacturer-1',
				name: 'Family A',
				description: 'Description A',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'family-2',
				manufacturer_id: 'manufacturer-1',
				name: 'Family B',
				description: 'Description B',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listDecoderFamiliesByManufacturer(db, 'manufacturer-1');

		expect(result).toEqual(rows);
	});

	it('returns empty array when manufacturer has no families', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listDecoderFamiliesByManufacturer(db, 'manufacturer-1');

		expect(result).toEqual([]);
	});

	it('filters families by manufacturer_id parameter', () => {
		mockStatement.all.mockReturnValue([]);

		listDecoderFamiliesByManufacturer(db, 'specific-manufacturer-id');

		expect(mockStatement.all).toHaveBeenCalledWith('specific-manufacturer-id');
	});

	it('returns families ordered by name', () => {
		const rows: DecoderFamily[] = [
			{
				id: 'family-1',
				manufacturer_id: 'manufacturer-1',
				name: 'Zebra Family',
				description: '',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'family-2',
				manufacturer_id: 'manufacturer-1',
				name: 'Alpha Family',
				description: '',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		listDecoderFamiliesByManufacturer(db, 'manufacturer-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('ORDER BY name');
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.all.mockReturnValue([]);

		listDecoderFamiliesByManufacturer(db, 'manufacturer-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM decoder_families');
		expect(sql).toContain('WHERE manufacturer_id = ?');
	});

	it('selects all required columns', () => {
		mockStatement.all.mockReturnValue([]);

		listDecoderFamiliesByManufacturer(db, 'manufacturer-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('id');
		expect(sql).toContain('manufacturer_id');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});

	it('returns multiple families with different descriptions', () => {
		const rows: DecoderFamily[] = [
			{
				id: 'family-1',
				manufacturer_id: 'manufacturer-1',
				name: 'With Description',
				description: 'Detailed description',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'family-2',
				manufacturer_id: 'manufacturer-1',
				name: 'Without Description',
				description: '',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listDecoderFamiliesByManufacturer(db, 'manufacturer-1');

		expect(result).toHaveLength(2);
		expect(result[0]?.description).toBe('Detailed description');
		expect(result[1]?.description).toBe('');
	});
});

describe('getDecoderFamilyById', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns family when found by id', () => {
		const row: DecoderFamily = {
			id: 'family-1',
			manufacturer_id: 'manufacturer-1',
			name: 'Test Family',
			description: 'Test description',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderFamilyById(db, 'family-1');

		expect(result).toEqual(row);
	});

	it('returns family with empty string description', () => {
		const row: DecoderFamily = {
			id: 'family-1',
			manufacturer_id: 'manufacturer-1',
			name: 'Test Family',
			description: '',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderFamilyById(db, 'family-1');

		expect(result).toEqual(row);
		expect(result?.description).toBe('');
	});

	it('returns null when family not found', () => {
		mockStatement.get.mockReturnValue(undefined);

		const result = getDecoderFamilyById(db, 'non-existent');

		expect(result).toBeNull();
	});

	it('queries by correct id', () => {
		mockStatement.get.mockReturnValue(undefined);

		getDecoderFamilyById(db, 'specific-family-id');

		expect(mockStatement.get).toHaveBeenCalledWith('specific-family-id');
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.get.mockReturnValue(undefined);

		getDecoderFamilyById(db, 'family-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM decoder_families');
		expect(sql).toContain('WHERE id = ?');
	});

	it('selects all required columns', () => {
		mockStatement.get.mockReturnValue(undefined);

		getDecoderFamilyById(db, 'family-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('id');
		expect(sql).toContain('manufacturer_id');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});

	it('returns correct family when multiple exist', () => {
		const requestedRow: DecoderFamily = {
			id: 'family-42',
			manufacturer_id: 'manufacturer-1',
			name: 'Requested Family',
			description: 'This is the requested one',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(requestedRow);

		const result = getDecoderFamilyById(db, 'family-42');

		expect(result?.id).toBe('family-42');
		expect(result?.name).toBe('Requested Family');
		expect(mockStatement.get).toHaveBeenCalledWith('family-42');
	});

	it('handles family with very long description', () => {
		const longDescription = 'A'.repeat(1000);
		const row: DecoderFamily = {
			id: 'family-1',
			manufacturer_id: 'manufacturer-1',
			name: 'Family',
			description: longDescription,
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderFamilyById(db, 'family-1');

		expect(result?.description).toBe(longDescription);
	});

	it('handles family with empty string name', () => {
		const row: DecoderFamily = {
			id: 'family-1',
			manufacturer_id: 'manufacturer-1',
			name: '',
			description: 'Description',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderFamilyById(db, 'family-1');

		expect(result).toEqual(row);
		expect(result?.name).toBe('');
	});
});
