/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '../../db';
import { nowIso } from '../../now';
import type { CvDefinitionOverridePatch, CvDefinitionOverrideRow } from '../../programming/cv-definition-overrides';

/** Creates a new CV definition override entry for the given decoder. */
export function createCvDefinitionOverride(
	db: Db,
	params: {
		id: string;
		decoderId: string;
		baseDefinitionId: string;
		isDisabled?: boolean;
		patch: CvDefinitionOverridePatch;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
	INSERT INTO cv_definition_overrides (
		id,
	    decoder_id,
	    base_definition_id,
	    is_disabled,
	    patch_json,
	    created_at,
	    updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	).run(params.id, params.decoderId, params.baseDefinitionId, params.isDisabled ? 1 : 0, JSON.stringify(params.patch), now, now);
}

/** Returns all CV definition overrides for the given decoder. */
export function listCvDefinitionOverridesByDecoder(db: Db, decoderId: string): CvDefinitionOverrideRow[] {
	return db
		.prepare(
			`
	SELECT
		id,
		decoder_id,
		base_definition_id,
		is_disabled,
		patch_json,
		created_at,
		updated_at
	FROM cv_definition_overrides
	WHERE decoder_id = ?
	`
		)
		.all(decoderId) as CvDefinitionOverrideRow[];
}

/** Updates disabled state and patch payload of an existing override row. */
export function updateCvDefinitionOverrideRow(
	db: Db,
	params: {
		id: string;
		isDisabled: boolean;
		patch: CvDefinitionOverridePatch;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
    UPDATE cv_definition_overrides
    SET
      is_disabled = ?,
      patch_json = ?,
      updated_at = ?
    WHERE id = ?
  `
	).run(params.isDisabled ? 1 : 0, JSON.stringify(params.patch), now, params.id);
}

/** Deletes an override row by id. */
export function deleteCvDefinitionOverrideRow(db: Db, id: string): void {
	db.prepare(
		`
    DELETE FROM cv_definition_overrides
    WHERE id = ?
  `
	).run(id);
}

/** Returns all overrides that reference the given base definition id. */
export function listCvDefinitionOverridesByBaseDefinition(db: Db, baseDefinitionId: string): CvDefinitionOverrideRow[] {
	return db
		.prepare(
			`
    SELECT
      id,
      decoder_id,
      base_definition_id,
      is_disabled,
      patch_json,
      created_at,
      updated_at
    FROM cv_definition_overrides
    WHERE base_definition_id = ?
  `
		)
		.all(baseDefinitionId) as CvDefinitionOverrideRow[];
}

/** Returns a single override by id, or null when not found. */
export function getCvDefinitionOverrideById(db: Db, id: string): CvDefinitionOverrideRow | null {
	const row = db
		.prepare(
			`
    SELECT
      id,
      decoder_id,
      base_definition_id,
      is_disabled,
      patch_json,
      created_at,
      updated_at
    FROM cv_definition_overrides
    WHERE id = ?
  `
		)
		.get(id) as CvDefinitionOverrideRow | undefined;

	return row ?? null;
}
