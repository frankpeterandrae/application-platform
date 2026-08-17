/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { Db, withTx } from '../db';

import { DatabaseSnapshotConfig, DatabaseSnapshotRow, DatabaseSnapshotTableConfig } from './database-snapshot.types';
import { getSnapshotTables, getTableColumns, quoteIdentifier } from './database-snapshot.utils';
interface ForeignKeyViolation {
	table: string;
	rowid: number;
	parent: string;
	fkid: number;
}

/**
 * Imports matching snapshot data into an existing migrated database.
 *
 * Tables without snapshot data remain unchanged.
 *
 * @param db Database connection.
 * @param dataDir Snapshot directory.
 * @param config Snapshot configuration.
 */
export function importDatabaseSnapshot(db: Db, dataDir: string, config: DatabaseSnapshotConfig): void {
	if (!fs.existsSync(dataDir)) {
		throw new Error(`Import directory does not exist: ${dataDir}`);
	}

	const tables = getSnapshotTables(db, config.tablePrefix)
		.filter((table) => config.tables?.[table]?.import !== false)
		.map((table) => ({
			table,
			rows: readTableRows(dataDir, table, config.tables?.[table])
		}))
		.filter(
			(
				entry
			): entry is {
				table: string;
				rows: DatabaseSnapshotRow[];
			} => entry.rows !== undefined
		);

	for (const { table, rows } of tables) {
		validateRows(db, table, rows);
	}

	db.pragma('foreign_keys = OFF');

	try {
		withTx(db, () => {
			for (const { table, rows } of tables) {
				replaceTableRows(db, table, rows);
			}
		});
	} finally {
		db.pragma('foreign_keys = ON');
	}

	const violations = db.pragma('foreign_key_check') as ForeignKeyViolation[];

	if (Array.isArray(violations) && violations.length > 0) {
		throw new Error('Foreign key validation failed after snapshot import.');
	}
}

/**
 * Reads the rows of a single database table from a JSON snapshot.
 *
 * @param dataDir Snapshot directory.
 * @param table Database table name.
 * @param config Snapshot configuration for the table.
 */
function readTableRows(dataDir: string, table: string, config: DatabaseSnapshotTableConfig | undefined): DatabaseSnapshotRow[] | undefined {
	if (config?.groupBy) {
		const directory = path.join(dataDir, table);

		if (!fs.existsSync(directory)) {
			return undefined;
		}

		const files = fs
			.readdirSync(directory, {
				withFileTypes: true
			})
			.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
			.map((entry) => path.join(directory, entry.name))
			.sort((a, b) => a.localeCompare(b));

		return files.flatMap(readRows);
	}

	const file = path.join(dataDir, `${table}.json`);

	return fs.existsSync(file) ? readRows(file) : undefined;
}

/**
 * Reads the rows of a single database table from a JSON file.
 *
 * @param file Snapshot file path.
 */
function readRows(file: string): DatabaseSnapshotRow[] {
	const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));

	if (!Array.isArray(parsed)) {
		throw new TypeError(`Import file must contain an array: ${file}`);
	}

	return parsed.map((row, index) => {
		if (row === null || typeof row !== 'object' || Array.isArray(row)) {
			throw new TypeError(`Invalid row in ${file} at index ${index}`);
		}

		return row as DatabaseSnapshotRow;
	});
}

/**
 * Validates that the rows to be imported match the columns of the database table.
 *
 * @param db Database connection.
 * @param table Database table name.
 * @param rows Rows to validate.
 */
function validateRows(db: Db, table: string, rows: DatabaseSnapshotRow[]): void {
	const columns = getTableColumns(db, table);

	for (let index = 0; index < rows.length; index += 1) {
		for (const column of Object.keys(rows[index])) {
			if (!columns.has(column)) {
				throw new Error(`Unknown column "${column}" in table "${table}" at row ${index}`);
			}
		}
	}
}

/**
 * Replaces the rows of a single database table with new rows.
 *
 * @param db Database connection.
 * @param table Database table name.
 * @param rows New rows to insert.
 */
function replaceTableRows(db: Db, table: string, rows: DatabaseSnapshotRow[]): void {
	db.prepare(`DELETE FROM ${quoteIdentifier(table)}`).run();

	const statements = new Map<string, ReturnType<Db['prepare']>>();

	for (const row of rows) {
		const columns = Object.keys(row).sort((a, b) => a.localeCompare(b));

		if (columns.length === 0) {
			throw new Error(`Cannot import empty object into table "${table}".`);
		}

		const key = columns.join('\u0000');

		let statement = statements.get(key);

		if (!statement) {
			const columnSql = columns.map(quoteIdentifier).join(', ');

			const placeholders = columns.map(() => '?').join(', ');

			statement = db.prepare(
				`
					INSERT INTO ${quoteIdentifier(table)}
						(${columnSql})
					VALUES
						(${placeholders})
				`
			);

			statements.set(key, statement);
		}

		const values = columns.map((column) => row[column] ?? null);

		(statement.run as (...values: unknown[]) => unknown)(...values);
	}
}
