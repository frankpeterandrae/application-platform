/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db } from '../db';

/**
 * Quotes an SQLite identifier.
 *
 * @param identifier Identifier to quote.
 * @returns Quoted identifier.
 */
export function quoteIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

/**
 * Returns database tables matching the configured prefix.
 *
 * @param db Database connection.
 * @param prefix Required table prefix.
 * @returns Matching table names.
 */
export function getSnapshotTables(db: Db, prefix: string): string[] {
	const rows = db
		.prepare(
			`
				SELECT name
				FROM sqlite_master
				WHERE type = 'table'
				  AND name NOT LIKE 'sqlite_%'
				  AND name LIKE ?
				ORDER BY name
			`
		)
		.all(`${prefix}%`) as Array<{ name: string }>;

	return rows.map(({ name }) => name);
}

/**
 * Returns all columns of a table.
 *
 * @param db Database connection.
 * @param table Table name.
 * @returns Column names.
 */
export function getTableColumns(db: Db, table: string): Set<string> {
	const rows = db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all() as Array<{ name: string }>;

	return new Set(rows.map(({ name }) => name));
}
