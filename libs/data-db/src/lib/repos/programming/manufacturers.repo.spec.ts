/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '../../db';

import { createManufacturer, getManufacturerById, listManufacturers, type ManufacturerRow } from './manufacturers.repo';

type MockStatement = {
	run: ReturnType<typeof vi.fn>;
	all: ReturnType<typeof vi.fn>;
	get: ReturnType<typeof vi.fn>;
};

function createMockDb(): { db: Db; statement: MockStatement } {
	const statement: MockStatement = {
		run: vi.fn(),
		all: vi.fn(),
		get: vi.fn()
	};

	const db = {
		prepare: vi.fn().mockReturnValue(statement)
	} as unknown as Db;

	return { db, statement };
}

describe('createManufacturer', () => {
	let db: Db;
	let statement: MockStatement;

	beforeEach(() => {
		({ db, statement } = createMockDb());
	});

	it('inserts manufacturer with id, name and matching timestamps', () => {
		createManufacturer(db, { id: 'm-1', name: 'Acme' });

		expect(statement.run).toHaveBeenCalledWith('m-1', 'Acme', expect.any(String), expect.any(String));

		const args = statement.run.mock.calls[0]!;
		expect(args[2]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(args[3]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(args[2]).toBe(args[3]);
	});

	it('uses insert statement targeting manufacturers table', () => {
		createManufacturer(db, { id: 'm-1', name: 'Acme' });

		const sql = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
		expect(sql).toContain('INSERT INTO');
		expect(sql).toContain('manufacturers');
		expect(sql).toContain('id');
		expect(sql).toContain('name');
		expect(sql).toContain('created_at');
		expect(sql).toContain('updated_at');
	});

	it('passes through empty manufacturer name', () => {
		createManufacturer(db, { id: 'm-1', name: '' });

		expect(statement.run).toHaveBeenCalledWith('m-1', '', expect.any(String), expect.any(String));
	});
});

describe('listManufacturers', () => {
	let db: Db;
	let statement: MockStatement;

	beforeEach(() => {
		({ db, statement } = createMockDb());
	});

	it('returns all manufacturers from query result', () => {
		const rows: ManufacturerRow[] = [
			{
				id: 'm-1',
				name: 'Acme',
				created_at: '2026-03-23T10:00:00.000Z',
				updated_at: '2026-03-23T10:00:00.000Z'
			},
			{
				id: 'm-2',
				name: 'Beta',
				created_at: '2026-03-23T11:00:00.000Z',
				updated_at: '2026-03-23T11:00:00.000Z'
			}
		];
		statement.all.mockReturnValue(rows);

		const result = listManufacturers(db);

		expect(result).toEqual(rows);
	});

	it('returns empty array when no manufacturers exist', () => {
		statement.all.mockReturnValue([]);

		expect(listManufacturers(db)).toEqual([]);
	});

	it('uses select statement ordered by name', () => {
		statement.all.mockReturnValue([]);
		listManufacturers(db);

		const sql = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
		expect(sql).toContain('SELECT id, name, created_at, updated_at');
		expect(sql).toContain('FROM manufacturers');
		expect(sql).toContain('ORDER BY name');
	});
});

describe('getManufacturerById', () => {
	let db: Db;
	let statement: MockStatement;

	beforeEach(() => {
		({ db, statement } = createMockDb());
	});

	it('returns manufacturer when id exists', () => {
		const row: ManufacturerRow = {
			id: 'm-1',
			name: 'Acme',
			created_at: '2026-03-23T10:00:00.000Z',
			updated_at: '2026-03-23T10:00:00.000Z'
		};
		statement.get.mockReturnValue(row);

		expect(getManufacturerById(db, 'm-1')).toEqual(row);
	});

	it('returns null when manufacturer does not exist', () => {
		statement.get.mockReturnValue(undefined);

		expect(getManufacturerById(db, 'missing')).toBeNull();
	});

	it('queries by provided manufacturer id', () => {
		statement.get.mockReturnValue(undefined);
		getManufacturerById(db, 'm-42');

		expect(statement.get).toHaveBeenCalledWith('m-42');
	});

	it('uses select statement with id filter', () => {
		statement.get.mockReturnValue(undefined);
		getManufacturerById(db, 'm-1');

		const sql = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
		expect(sql).toContain('SELECT id, name, created_at, updated_at');
		expect(sql).toContain('FROM manufacturers');
		expect(sql).toContain('WHERE id = ?');
	});
});
