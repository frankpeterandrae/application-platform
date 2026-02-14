/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

export type Db = Database.Database;

/**
 * Open the database connection.
 * The database file is determined by the following order:
 * 1. The `dbPath` option passed to this function.
 * 2. The `DB_PATH` environment variable.
 * 3. The default path `./data/z21.db` in the current working directory.
 * @param opts Options for opening the database.
 * @returns The opened database connection.
 */
export function openDb(opts?: { dbPath?: string }): Db {
	const dbPath = opts?.dbPath ?? process.env['DB_PATH'] ?? path.join(process.cwd(), 'data', 'z21.db');

	fs.mkdirSync(path.dirname(dbPath), { recursive: true });

	const db = new Database(dbPath);

	db.pragma('journal_mode = WAL');
	db.pragma('synchronous = NORMAL');
	db.pragma('foreign_keys = ON');

	return db;
}

/**
 * Execute a function within a database transaction. If the function throws an error, the transaction will be rolled back. Otherwise, it will be committed.
 * @param db The database connection to use for the transaction.
 * @param fn The function to execute within the transaction.
 * @returns The result of the function execution.
 */
export function withTx<T>(db: Db, fn: () => T): T {
	const tx = db.transaction(fn);
	return tx();
}
