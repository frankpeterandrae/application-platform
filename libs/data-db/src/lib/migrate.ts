/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import path from 'node:path';

import { Db, withTx } from './db';

/**
 * Lists all SQL files in the given directory that match the pattern "NNN_description.sql",
 * where NNN is a numeric prefix used for ordering.
 * @param dir The directory to search for SQL migration files.
 */
function listSqlFiles(dir: string): string[] {
	return fs
		.readdirSync(dir)
		.filter((f) => /^\d+_.*\.sql$/.test(f))
		.sort()
		.map((f) => path.join(dir, f));
}

/**
 * Applies all pending migrations from the specified directory to the given database connection.
 * Migrations are SQL files that follow the naming convention "NNN_description.sql", where NNN is a numeric prefix used for ordering.
 * The function creates a "migrations" table if it doesn't exist to track which migrations have been applied.
 * It then executes each pending migration in order and records its application in the "migrations" table.
 * @param db The database connection to apply the migrations to.
 * @param migrationsDir The directory containing the SQL migration files.
 */
export function migrate(db: Db, migrationsDir: string): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

	const applied = new Set((db.prepare('SELECT id FROM migrations').all() as { id: string }[]).map((r) => r.id));

	const files = listSqlFiles(migrationsDir);

	withTx(db, () => {
		for (const file of files) {
			const id = path.basename(file);
			if (applied.has(id)) continue;

			const sql = fs.readFileSync(file, 'utf8');
			db.exec(sql);

			db.prepare('INSERT INTO migrations (id, applied_at) VALUES (?, ?)').run(id, new Date().toISOString());
		}
	});
}
