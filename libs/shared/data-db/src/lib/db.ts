/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

/**
 * SQLite database connection used by the data access layer.
 */
export type Db = Database.Database;

/**
 * Opens a SQLite database at the specified path.
 *
 * The required parent directories are created automatically and the
 * connection is configured for WAL mode and foreign key enforcement.
 *
 * @param dbPath The path to the database file.
 * @returns The opened database connection.
 */
export function openDb(dbPath: string): Db {
	fs.mkdirSync(path.dirname(dbPath), { recursive: true });

	const db = new Database(dbPath);

	db.pragma('journal_mode = WAL');
	db.pragma('synchronous = NORMAL');
	db.pragma('foreign_keys = ON');

	return db;
}

/**
 * Executes a function within a database transaction.
 *
 * The transaction is committed when the function completes successfully
 * and rolled back when it throws.
 *
 * @param db The database connection.
 * @param fn The function to execute within the transaction.
 * @returns The function result.
 */
export function withTx<T>(db: Db, fn: () => T): T {
	const tx = db.transaction(fn);
	return tx();
}
