/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { type Db, withTx } from '../db';

import type { DatabaseSnapshotConfig, DatabaseSnapshotRow, DatabaseSnapshotTableConfig } from './database-snapshot.types';
import { getSnapshotTables, quoteIdentifier } from './database-snapshot.utils';

/**
 * Exports all matching database tables into a JSON snapshot.
 *
 * Tables are exported automatically unless explicitly disabled.
 *
 * @param db Database connection.
 * @param dataDir Snapshot directory.
 * @param config Snapshot configuration.
 */
export function exportDatabaseSnapshot(db: Db, dataDir: string, config: DatabaseSnapshotConfig): void {
	replaceSnapshot(dataDir, (directory) =>
		withTx(db, () => {
			for (const table of getSnapshotTables(db, config.tablePrefix)) {
				const tableConfig = config.tables?.[table];

				if (tableConfig?.export === false) {
					continue;
				}

				exportTable(db, directory, table, tableConfig);
			}
		})
	);
}

/**
 * Exports a single database table into a JSON snapshot.
 *
 * @param db Database connection.
 * @param directory Snapshot directory.
 * @param table	Database table name.
 * @param config snapshot configuration for the table.
 */
function exportTable(db: Db, directory: string, table: string, config: DatabaseSnapshotTableConfig | undefined): void {
	const orderBy = config?.orderBy?.length ? ` ORDER BY ${config.orderBy.map(quoteIdentifier).join(', ')}` : '';

	const rows = db.prepare(`SELECT * FROM ${quoteIdentifier(table)}${orderBy}`).all() as DatabaseSnapshotRow[];

	if (config?.groupBy) {
		exportGroupedTable(directory, table, rows, config.groupBy);

		return;
	}

	writeJson(path.join(directory, `${table}.json`), rows);
}

/**
 * Exports a single database table into a JSON snapshot, grouped by a specific column.
 *
 * @param directory Snapshot directory.
 * @param table Database table name.
 * @param rows Table rows to export.
 * @param groupBy Column name to group by.
 */
function exportGroupedTable(directory: string, table: string, rows: DatabaseSnapshotRow[], groupBy: string): void {
	const groups = new Map<string, DatabaseSnapshotRow[]>();

	for (const row of rows) {
		const value = row[groupBy];

		if (typeof value !== 'string' && typeof value !== 'number') {
			throw new TypeError(`Table "${table}" contains an invalid value for grouping column "${groupBy}".`);
		}

		const key = String(value);
		const groupRows = groups.get(key) ?? [];

		groupRows.push(row);
		groups.set(key, groupRows);
	}

	for (const [key, groupRows] of groups) {
		if (path.posix.basename(key) !== key || path.win32.basename(key) !== key || key.includes(':')) {
			throw new TypeError(`Table "${table}" contains an invalid snapshot file name.`);
		}

		writeJson(path.join(directory, table, `${key}.json`), groupRows);
	}
}

/**
 * Writes a formatted JSON snapshot file.
 *
 * @param file Snapshot file.
 * @param data Data to serialize.
 */
function writeJson(file: string, data: unknown): void {
	fs.mkdirSync(path.dirname(file), {
		recursive: true
	});

	fs.writeFileSync(file, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
}

/**
 * Replaces the snapshot directory with a new snapshot.
 *
 * @param dataDir Snapshot directory.
 * @param writeSnapshot Callback to write a complete snapshot into staging.
 */
function replaceSnapshot(dataDir: string, writeSnapshot: (directory: string) => void): void {
	const target = path.resolve(dataDir);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	const stagingDir = fs.mkdtempSync(`${target}.__staging-`);

	try {
		writeSnapshot(stagingDir);
	} catch (error) {
		try {
			fs.rmSync(stagingDir, { recursive: true, force: true });
		} catch (cleanupError) {
			throw new AggregateError([error, cleanupError], `Could not write or clean up snapshot staging at "${stagingDir}".`);
		}
		throw error;
	}

	// A non-empty directory must be removed before it can be replaced by rename.
	try {
		fs.rmSync(target, { recursive: true, force: true });
		fs.renameSync(stagingDir, target);
	} catch (error) {
		throw new Error(`Could not replace snapshot at "${target}". Complete snapshot remains at "${stagingDir}".`, {
			cause: error
		});
	}
}
