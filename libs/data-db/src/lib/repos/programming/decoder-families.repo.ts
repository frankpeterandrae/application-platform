/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db } from '../../db';
import { nowIso } from '../../now';

export type DecoderFamily = {
	id: string;
	manufacturer_id: string;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
};

/** Creates a new decoder family entry. */
export function createDecoderFamily(
	db: Db,
	params: {
		id: string;
		manufacturerId: string;
		name: string;
		description?: string;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
		INSERT INTO decoder_families (id, manufacturer_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
	`
	).run(params.id, params.manufacturerId, params.name, params.description, now, now);
}

/** Returns all decoder families for the given manufacturer, ordered by name. */
export function listDecoderFamiliesByManufacturer(db: Db, manufacturerId: string): DecoderFamily[] {
	return db
		.prepare(
			`
    	SELECT id, manufacturer_id, name, description, created_at, updated_at
    	FROM decoder_families
    	WHERE manufacturer_id = ?
    	ORDER BY name
	`
		)
		.all(manufacturerId) as DecoderFamily[];
}

/** Returns the decoder family with the given id, or null if not found. */
export function getDecoderFamilyById(db: Db, id: string): DecoderFamily | null {
	const row = db
		.prepare(
			`
	    SELECT id, manufacturer_id, name, description, created_at, updated_at
	    FROM decoder_families
	    WHERE id = ?
	`
		)
		.get(id) as DecoderFamily | undefined;

	return row ?? null;
}
