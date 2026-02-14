/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '../../db';
import { nowIso } from '../../now';

export type DecoderRow = {
	id: string;
	family_id: string;
	name: string;
	description: string | null;
	created_at: string;
	updated_at: string;
};

/** Creates a new decoder entry. */
export function createDecoder(
	db: Db,
	params: {
		id: string;
		familyId: string;
		name: string;
		description?: string | null;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
    INSERT INTO decoders (
      id,
      family_id,
      name,
      description,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `
	).run(params.id, params.familyId, params.name, params.description ?? null, now, now);
}

/** Returns all decoders for the given family, ordered by name. */
export function listDecodersByFamily(db: Db, familyId: string): DecoderRow[] {
	return db
		.prepare(
			`
    SELECT id, family_id, name, description, created_at, updated_at
    FROM decoders
    WHERE family_id = ?
    ORDER BY name
  `
		)
		.all(familyId) as DecoderRow[];
}

/** Returns the decoder with the given id, or null if not found. */
export function getDecoderById(db: Db, id: string): DecoderRow | null {
	const row = db
		.prepare(
			`
    SELECT id, family_id, name, description, created_at, updated_at
    FROM decoders
    WHERE id = ?
  `
		)
		.get(id) as DecoderRow | undefined;

	return row ?? null;
}
