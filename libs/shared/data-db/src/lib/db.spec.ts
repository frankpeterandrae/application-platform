/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openDb, withTx, type Db } from './db';

vi.mock('node:fs', () => ({
	default: {
		mkdirSync: vi.fn()
	}
}));

const { databaseCtorMock, DatabaseMock } = vi.hoisted(() => {
	const databaseCtorMock = vi.fn();

	class DatabaseMock {
		constructor(...args: unknown[]) {
			return databaseCtorMock(...args) as object;
		}
	}

	return { databaseCtorMock, DatabaseMock };
});

vi.mock('better-sqlite3', () => ({
	default: DatabaseMock
}));

describe('openDb', () => {
	const originalDbPath = process.env['DB_PATH'];

	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env['DB_PATH'];
	});

	afterEach(() => {
		if (originalDbPath === undefined) {
			delete process.env['DB_PATH'];
		} else {
			process.env['DB_PATH'] = originalDbPath;
		}
	});

	it('uses explicit dbPath option over environment and default path', () => {
		const dbMock = { pragma: vi.fn() } as unknown as Db;
		databaseCtorMock.mockReturnValue(dbMock);
		process.env['DB_PATH'] = 'D:/data/custom.db';

		openDb(process.env['DB_PATH'] ?? path.join(process.cwd(), 'data', 'custom.db'));

		expect(databaseCtorMock).toHaveBeenCalledWith('D:/data/custom.db');
	});

	it('creates parent directory before opening database file', () => {
		const dbMock = { pragma: vi.fn() } as unknown as Db;
		databaseCtorMock.mockReturnValue(dbMock);
		process.env['DB_PATH'] = 'D:/x/y/custom.db';

		openDb(process.env['DB_PATH'] ?? path.join(process.cwd(), 'x', 'y', 'custom.db'));

		expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname('D:/x/y/custom.db'), { recursive: true });
	});

	it('enables expected sqlite pragmas and returns database instance', () => {
		const pragma = vi.fn();
		const dbMock = { pragma } as unknown as Db;
		databaseCtorMock.mockReturnValue(dbMock);

		const result = openDb(process.env['DB_PATH'] ?? path.join(process.cwd(), 'data', 'custom.db'));

		expect(pragma).toHaveBeenNthCalledWith(1, 'journal_mode = WAL');
		expect(pragma).toHaveBeenNthCalledWith(2, 'synchronous = NORMAL');
		expect(pragma).toHaveBeenNthCalledWith(3, 'foreign_keys = ON');
		expect(result).toBe(dbMock);
	});
});

describe('withTx', () => {
	it('executes function through transaction wrapper and returns its value', () => {
		const transactionalRunner = vi.fn(() => 42);
		const transaction = vi.fn(() => transactionalRunner);
		const db = { transaction } as unknown as Db;
		const fn = vi.fn(() => 42);
		transactionalRunner.mockImplementation(fn);

		const result = withTx(db, fn);

		expect(transaction).toHaveBeenCalledWith(fn);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(result).toBe(42);
	});

	it('propagates errors thrown by the transactional function', () => {
		const error = new Error('boom');
		const transaction = vi.fn((fnArg: () => unknown) => () => fnArg());
		const db = { transaction } as unknown as Db;
		const fn = vi.fn(() => {
			throw error;
		});

		expect(() => withTx(db, fn)).toThrow(error);
		expect(transaction).toHaveBeenCalledWith(fn);
	});
});
