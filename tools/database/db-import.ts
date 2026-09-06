/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import path from 'node:path';

import { importDatabaseSnapshot, openDb } from '../../libs/shared/data-db/src';

import { paintSnapshotConfig } from '../../libs/stream-overlay/paint-data-access/src';

type JsonRow = Record<string, unknown>;

interface ImportTable {
	readonly name: string;
	readonly files: string[];
}

interface TableInfoRow {
	readonly name: string;
}

interface ForeignKeyRow {
	readonly table: string;
}

const args = process.argv.slice(2);

const dbPath = path.resolve(getArg('--db'));

const dataDir = path.resolve(getArg('--data'));

const db = openDb(dbPath);
/**
 * Returns the value belonging to a command-line argument.
 *
 * @param name Argument name.
 * @returns Argument value.
 */
function getArg(name: string): string {
	const index = args.indexOf(name);

	if (index === -1 || !args[index + 1]) {
		throw new Error(`Missing argument: ${name}`);
	}

	return args[index + 1];
}

try {
	db.prepare('DELETE FROM paint_recent_selection').run();
	importDatabaseSnapshot(db, dataDir, paintSnapshotConfig);

	console.log(`Datenbankimport erfolgreich: ${dbPath}`);
} finally {
	db.close();
}
