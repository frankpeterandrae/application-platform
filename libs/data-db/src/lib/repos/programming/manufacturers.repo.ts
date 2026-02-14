/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '../../db';
import { nowIso } from '../../now';

export type ManufacturerRow = {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
};

/** Creates a new manufacturer entry. */
export function createManufacturer(
	db: Db,
	params: {
		id: string;
		name: string;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
    INSERT INTO manufacturers (
      id,
      name,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?)
  `
	).run(params.id, params.name, now, now);
}

/** Returns all manufacturers ordered by name. */
export function listManufacturers(db: Db): ManufacturerRow[] {
	return db
		.prepare(
			`
    SELECT id, name, created_at, updated_at
    FROM manufacturers
    ORDER BY name
  `
		)
		.all() as ManufacturerRow[];
}

/** Returns the manufacturer with the given id, or null if not found. */
export function getManufacturerById(db: Db, id: string): ManufacturerRow | null {
	const row = db
		.prepare(
			`
    SELECT id, name, created_at, updated_at
    FROM manufacturers
    WHERE id = ?
  `
		)
		.get(id) as ManufacturerRow | undefined;

	return row ?? null;
}
