/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { Db } from '../db';

import { DatabaseSnapshotConfig, DatabaseSnapshotRow, DatabaseSnapshotTableConfig } from './database-snapshot.types';
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
	replaceSnapshot(dataDir, (directory) => {
		for (const table of getSnapshotTables(db, config.tablePrefix)) {
			const tableConfig = config.tables?.[table];

			if (tableConfig?.export === false) {
				continue;
			}

			exportTable(db, directory, table, tableConfig);
		}
	});
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
		writeJson(path.join(directory, table, `${key}.json`), groupRows);
	}
}

/**
 * Replaces the snapshot directory with a new snapshot.
 *
 * @param dataDir Snapshot directory.
 * @param writeSnapshot Callback to write the snapshot into a staging directory.
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
 * @param dataDir
 * @param writeSnapshot
 */
function replaceSnapshot(dataDir: string, writeSnapshot: (directory: string) => void): void {
	const stagingDir = `${dataDir}.__staging`;

	fs.rmSync(stagingDir, {
		recursive: true,
		force: true
	});

	fs.mkdirSync(stagingDir, {
		recursive: true
	});

	writeSnapshot(stagingDir);

	fs.rmSync(dataDir, {
		recursive: true,
		force: true
	});

	fs.cpSync(stagingDir, dataDir, {
		recursive: true
	});

	fs.rmSync(stagingDir, {
		recursive: true,
		force: true
	});
}
