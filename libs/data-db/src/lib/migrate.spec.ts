/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withTx, type Db } from './db';
import { migrate } from './migrate';

vi.mock('node:fs', () => ({
	default: {
		readdirSync: vi.fn(),
		readFileSync: vi.fn()
	}
}));

vi.mock('./db', () => ({
	withTx: vi.fn((_db: Db, fn: () => void) => fn())
}));

describe('migrate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates migrations table before checking pending migrations', () => {
		const selectAll = vi.fn().mockReturnValue([]);
		const insertRun = vi.fn();
		const prepare = vi.fn((sql: string) => {
			if (sql.includes('SELECT id FROM migrations')) {
				return { all: selectAll };
			}
			if (sql.includes('INSERT INTO migrations')) {
				return { run: insertRun };
			}
			throw new Error(`Unexpected SQL: ${sql}`);
		});
		const exec = vi.fn();
		const db = { prepare, exec } as unknown as Db;

		vi.mocked(fs.readdirSync).mockReturnValue([] as never);

		migrate(db, 'D:/migrations');

		expect(exec).toHaveBeenNthCalledWith(1, expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations'));
		expect(selectAll).toHaveBeenCalledTimes(1);
		expect(insertRun).not.toHaveBeenCalled();
	});

	it('applies pending migrations in sorted order and records them', () => {
		const appliedRows = [{ id: '001_initial.sql' }];
		const selectAll = vi.fn().mockReturnValue(appliedRows);
		const insertRun = vi.fn();
		const prepare = vi.fn((sql: string) => {
			if (sql.includes('SELECT id FROM migrations')) {
				return { all: selectAll };
			}
			if (sql.includes('INSERT INTO migrations')) {
				return { run: insertRun };
			}
			throw new Error(`Unexpected SQL: ${sql}`);
		});
		const exec = vi.fn();
		const db = { prepare, exec } as unknown as Db;

		vi.mocked(fs.readdirSync).mockReturnValue([
			'010_add_table.sql',
			'001_initial.sql',
			'002_seed_data.sql',
			'not-a-migration.txt'
		] as never);
		vi.mocked(fs.readFileSync).mockImplementation((filePath: unknown) => `-- ${String(filePath)}` as never);

		migrate(db, 'D:/migrations');

		expect(exec).toHaveBeenNthCalledWith(2, '-- D:\\migrations\\002_seed_data.sql');
		expect(exec).toHaveBeenNthCalledWith(3, '-- D:\\migrations\\010_add_table.sql');
		expect(insertRun).toHaveBeenCalledTimes(2);
		expect(insertRun).toHaveBeenNthCalledWith(1, '002_seed_data.sql', expect.any(String));
		expect(insertRun).toHaveBeenNthCalledWith(2, '010_add_table.sql', expect.any(String));
	});

	it('does not execute migration SQL when all files are already applied', () => {
		const appliedRows = [{ id: '001_initial.sql' }, { id: '002_seed_data.sql' }];
		const selectAll = vi.fn().mockReturnValue(appliedRows);
		const insertRun = vi.fn();
		const prepare = vi.fn((sql: string) => {
			if (sql.includes('SELECT id FROM migrations')) {
				return { all: selectAll };
			}
			if (sql.includes('INSERT INTO migrations')) {
				return { run: insertRun };
			}
			throw new Error(`Unexpected SQL: ${sql}`);
		});
		const exec = vi.fn();
		const db = { prepare, exec } as unknown as Db;

		vi.mocked(fs.readdirSync).mockReturnValue(['002_seed_data.sql', '001_initial.sql'] as never);

		migrate(db, 'D:/migrations');

		expect(exec).toHaveBeenCalledTimes(1);
		expect(insertRun).not.toHaveBeenCalled();
		expect(vi.mocked(fs.readFileSync)).not.toHaveBeenCalled();
	});

	it('runs migration application inside transaction helper', () => {
		const selectAll = vi.fn().mockReturnValue([]);
		const insertRun = vi.fn();
		const prepare = vi.fn((sql: string) => {
			if (sql.includes('SELECT id FROM migrations')) {
				return { all: selectAll };
			}
			if (sql.includes('INSERT INTO migrations')) {
				return { run: insertRun };
			}
			throw new Error(`Unexpected SQL: ${sql}`);
		});
		const exec = vi.fn();
		const db = { prepare, exec } as unknown as Db;

		vi.mocked(fs.readdirSync).mockReturnValue([] as never);

		migrate(db, 'D:/migrations');

		expect(vi.mocked(withTx)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(withTx)).toHaveBeenCalledWith(db, expect.any(Function));
	});
});
