/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as path from 'node:path';
import { migrate, openDb } from '../libs/data-db';

const db = openDb();

try {
	const migrationsDir = path.join(process.cwd(), 'libs', 'data-db', 'src', 'lib', 'schema');

	migrate(db, migrationsDir);
	console.log('Migrationen erfolgreich ausgeführt.');
} finally {
	db.close();
}
