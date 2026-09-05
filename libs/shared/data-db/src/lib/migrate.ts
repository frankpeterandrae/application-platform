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
		.sort((a, b) => a.localeCompare(b))
		.map((f) => path.join(dir, f));
}

/**
 * Applies all pending SQL migrations from a directory.
 *
 * Applied migrations are tracked in the migrations table using a
 * namespace-prefixed migration ID.
 *
 * @param db The database connection to migrate.
 * @param migrationsDir The directory containing the migration files.
 * @param namespace The namespace used to distinguish migration sets.
 */
export function migrate(db: Db, migrationsDir: string, namespace: string): void {
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
			const filename = path.basename(file);
			const id = `${namespace}:${filename}`;

			if (applied.has(id)) {
				continue;
			}

			const sql = fs.readFileSync(file, 'utf8');

			db.exec(sql);

			db.prepare(
				`
        INSERT INTO migrations (
          id,
          applied_at
        )
        VALUES (?, ?)
      `
			).run(id, new Date().toISOString());
		}
	});
}
