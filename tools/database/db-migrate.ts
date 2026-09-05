/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as path from 'node:path';
import { migrate, openDb } from '../../libs/shared/data-db/src';

const args = process.argv.slice(2);

function getArg(name: string): string {
	const index = args.indexOf(name);

	if (index === -1 || !args[index + 1]) {
		throw new Error(`Missing argument: ${name}`);
	}

	return args[index + 1];
}

const dbPath = path.resolve(getArg('--db'));
const migrationsDir = path.resolve(getArg('--migrations'));
const nameSpace = getArg('--namespace');
const db = openDb(dbPath);

try {
	migrate(db, migrationsDir, nameSpace);

	console.log(`Migrationen erfolgreich ausgeführt: ${dbPath}`);
} finally {
	db.close();
}
