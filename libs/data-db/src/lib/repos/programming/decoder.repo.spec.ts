/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '../../db';

import { createDecoder, getDecoderById, listDecodersByFamily, type DecoderRow } from './decoder.repo';

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

describe('createDecoder', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('inserts decoder with all required parameters', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Decoder Name',
			description: 'Decoder description'
		};

		createDecoder(db, params);

		expect(mockStatement.run).toHaveBeenCalledWith(
			'decoder-1',
			'family-1',
			'Decoder Name',
			'Decoder description',
			expect.any(String),
			expect.any(String)
		);
	});

	it('inserts decoder with null description when not provided', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Decoder Name'
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBeNull();
	});

	it('inserts decoder with null description when explicitly set to null', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Decoder Name',
			description: null
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBeNull();
	});

	it('inserts decoder with provided description string', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Decoder Name',
			description: 'Custom description'
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[3]).toBe('Custom description');
	});

	it('uses ISO timestamp for created_at and updated_at', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Decoder Name'
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		const createdAt = args[4];
		const updatedAt = args[5];

		expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(createdAt).toBe(updatedAt);
	});

	it('executes INSERT statement with correct SQL structure', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Test Decoder'
		};

		createDecoder(db, params);

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('INSERT INTO decoders');
		expect(sql).toContain('id');
		expect(sql).toContain('family_id');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
		expect(sql).toContain('VALUES');
	});

	it('uses correct decoder id parameter', () => {
		const params = {
			id: 'specific-decoder-id',
			familyId: 'family-1',
			name: 'Decoder'
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[0]).toBe('specific-decoder-id');
	});

	it('uses correct family id parameter', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'specific-family-id',
			name: 'Decoder'
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[1]).toBe('specific-family-id');
	});

	it('uses correct decoder name parameter', () => {
		const params = {
			id: 'decoder-1',
			familyId: 'family-1',
			name: 'Custom Decoder Name'
		};

		createDecoder(db, params);

		const args = mockStatement.run.mock.calls[0];
		expect(args[2]).toBe('Custom Decoder Name');
	});
});

describe('listDecodersByFamily', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns all decoders for the given family', () => {
		const rows: DecoderRow[] = [
			{
				id: 'decoder-1',
				family_id: 'family-1',
				name: 'Decoder A',
				description: 'Description A',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'decoder-2',
				family_id: 'family-1',
				name: 'Decoder B',
				description: null,
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listDecodersByFamily(db, 'family-1');

		expect(result).toEqual(rows);
	});

	it('returns empty array when family has no decoders', () => {
		mockStatement.all.mockReturnValue([]);

		const result = listDecodersByFamily(db, 'family-1');

		expect(result).toEqual([]);
	});

	it('filters decoders by family_id parameter', () => {
		mockStatement.all.mockReturnValue([]);

		listDecodersByFamily(db, 'specific-family-id');

		expect(mockStatement.all).toHaveBeenCalledWith('specific-family-id');
	});

	it('returns decoders ordered by name', () => {
		const rows: DecoderRow[] = [
			{
				id: 'decoder-1',
				family_id: 'family-1',
				name: 'Zebra',
				description: null,
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'decoder-2',
				family_id: 'family-1',
				name: 'Alpha',
				description: null,
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		listDecodersByFamily(db, 'family-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('ORDER BY name');
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.all.mockReturnValue([]);

		listDecodersByFamily(db, 'family-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM decoders');
		expect(sql).toContain('WHERE family_id = ?');
	});

	it('selects all required columns', () => {
		mockStatement.all.mockReturnValue([]);

		listDecodersByFamily(db, 'family-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('id');
		expect(sql).toContain('family_id');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});

	it('returns multiple decoders with different descriptions', () => {
		const rows: DecoderRow[] = [
			{
				id: 'decoder-1',
				family_id: 'family-1',
				name: 'With Description',
				description: 'Detailed description',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'decoder-2',
				family_id: 'family-1',
				name: 'Without Description',
				description: null,
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		mockStatement.all.mockReturnValue(rows);

		const result = listDecodersByFamily(db, 'family-1');

		expect(result).toHaveLength(2);
		expect(result[0]?.description).toBe('Detailed description');
		expect(result[1]?.description).toBeNull();
	});
});

describe('getDecoderById', () => {
	let { db, mockStatement } = createMockDb();

	beforeEach(() => {
		({ db, mockStatement } = createMockDb());
	});

	it('returns decoder when found by id', () => {
		const row: DecoderRow = {
			id: 'decoder-1',
			family_id: 'family-1',
			name: 'Test Decoder',
			description: 'Test description',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderById(db, 'decoder-1');

		expect(result).toEqual(row);
	});

	it('returns decoder with null description', () => {
		const row: DecoderRow = {
			id: 'decoder-1',
			family_id: 'family-1',
			name: 'Test Decoder',
			description: null,
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderById(db, 'decoder-1');

		expect(result).toEqual(row);
		expect(result?.description).toBeNull();
	});

	it('returns null when decoder not found', () => {
		mockStatement.get.mockReturnValue(undefined);

		const result = getDecoderById(db, 'non-existent');

		expect(result).toBeNull();
	});

	it('queries by correct id', () => {
		mockStatement.get.mockReturnValue(undefined);

		getDecoderById(db, 'specific-decoder-id');

		expect(mockStatement.get).toHaveBeenCalledWith('specific-decoder-id');
	});

	it('executes SELECT statement with correct WHERE clause', () => {
		mockStatement.get.mockReturnValue(undefined);

		getDecoderById(db, 'decoder-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('SELECT');
		expect(sql).toContain('FROM decoders');
		expect(sql).toContain('WHERE id = ?');
	});

	it('selects all required columns', () => {
		mockStatement.get.mockReturnValue(undefined);

		getDecoderById(db, 'decoder-1');

		const prepareCall = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0];
		const sql = prepareCall[0];

		expect(sql).toContain('id');
		expect(sql).toContain('family_id');
		expect(sql).toContain('name');
		expect(sql).toContain('description');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});

	it('returns correct decoder when multiple exist', () => {
		const requestedRow: DecoderRow = {
			id: 'decoder-42',
			family_id: 'family-1',
			name: 'Requested Decoder',
			description: 'This is the requested one',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(requestedRow);

		const result = getDecoderById(db, 'decoder-42');

		expect(result?.id).toBe('decoder-42');
		expect(result?.name).toBe('Requested Decoder');
		expect(mockStatement.get).toHaveBeenCalledWith('decoder-42');
	});

	it('handles decoder with empty string name', () => {
		const row: DecoderRow = {
			id: 'decoder-1',
			family_id: 'family-1',
			name: '',
			description: null,
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderById(db, 'decoder-1');

		expect(result).toEqual(row);
		expect(result?.name).toBe('');
	});

	it('handles decoder with very long description', () => {
		const longDescription = 'A'.repeat(1000);
		const row: DecoderRow = {
			id: 'decoder-1',
			family_id: 'family-1',
			name: 'Decoder',
			description: longDescription,
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		mockStatement.get.mockReturnValue(row);

		const result = getDecoderById(db, 'decoder-1');

		expect(result?.description).toBe(longDescription);
	});
});
