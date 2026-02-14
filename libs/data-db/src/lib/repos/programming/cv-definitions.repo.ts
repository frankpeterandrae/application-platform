/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db } from '../../db';
import { nowIso } from '../../now';
import { buildCvDefinitionTree, CvDefinitionTreeNode } from '../../programming/cv-definition-tree';
import {
	CvDefinitionConfigByType,
	CvDefinitionType,
	CvOwnerType,
	parseCvBooleanConfig,
	parseCvNumberConfig,
	parseCvSelectConfig,
	parseFolderConfig
} from '../../programming/cv-definition-types';

export type CvDefinitionRow = {
	id: string;
	owner_type: CvOwnerType;
	owner_id: string;
	parent_id: string | null;
	sort_order: number;
	key: string;
	type: CvDefinitionType;
	name: string;
	description: string | null;
	config_json: string;
	created_at: string;
	updated_at: string;
};

type CvDefinitionCreateBase = {
	id: string;
	ownerType: CvOwnerType;
	ownerId: string;
	parentId?: string | null;
	sortOrder?: number;
	key: string;
	name: string;
	description?: string | null;
};

export type CreateFolderDefinitionParams = CvDefinitionCreateBase & {
	type: 'folder';
	config: CvDefinitionConfigByType['folder'];
};

export type CreateCvNumberDefinitionParams = CvDefinitionCreateBase & {
	type: 'cv_number';
	config: CvDefinitionConfigByType['cv_number'];
};

export type CreateCvBooleanDefinitionParams = CvDefinitionCreateBase & {
	type: 'cv_boolean';
	config: CvDefinitionConfigByType['cv_boolean'];
};

export type CreateCvSelectDefinitionParams = CvDefinitionCreateBase & {
	type: 'cv_select';
	config: CvDefinitionConfigByType['cv_select'];
};

export type CreateCvDefinitionParams =
	| CreateFolderDefinitionParams
	| CreateCvNumberDefinitionParams
	| CreateCvBooleanDefinitionParams
	| CreateCvSelectDefinitionParams;

/** Inserts a new CV definition row after validating its typed config. */
export function createCvDefinition(db: Db, params: CreateCvDefinitionParams): void {
	validateConfig(params);

	const now = nowIso();

	db.prepare(
		`
	INSERT INTO cv_definitions (id, owner_type, owner_id, parent_id, sort_order, key, type, name, description, config_json, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
	`
	).run(
		params.id,
		params.ownerType,
		params.ownerId,
		params.parentId ?? null,
		params.sortOrder ?? 0,
		params.key,
		params.type,
		params.name,
		params.description ?? null,
		JSON.stringify(params.config),
		now,
		now
	);
}

/** Validates the config field of the params against the expected shape for its type. */
function validateConfig(params: CreateCvDefinitionParams): void {
	switch (params.type) {
		case 'folder':
			parseFolderConfig(params.config);
			return;
		case 'cv_number':
			parseCvNumberConfig(params.config);
			return;
		case 'cv_boolean':
			parseCvBooleanConfig(params.config);
			return;
		case 'cv_select':
			parseCvSelectConfig(params.config);
			return;
		default: {
			throw new Error(`Unbekannter Definitionstyp: ${JSON.stringify(params)}`);
		}
	}
}

/** Returns all CV definition rows for the given owner, ordered by sort_order and name. */
export function listCvDefinitionsByOwner(db: Db, ownerType: CvOwnerType, ownerId: string): CvDefinitionRow[] {
	return db
		.prepare(
			`
	SELECT id, owner_type, owner_id, parent_id, sort_order, key, type, name, description, config_json, created_at, updated_at
	FROM cv_definitions
	WHERE owner_type = ? AND owner_id = ?
	ORDER BY sort_order, name
	`
		)
		.all(ownerType, ownerId) as CvDefinitionRow[];
}

/** Returns the CV definition row with the given id, or null if not found. */
export function getCvDefinitionById(db: Db, id: string): CvDefinitionRow | null {
	const row = db
		.prepare(
			`
	SELECT id, owner_type, owner_id, parent_id, sort_order, key, type, name, description, config_json, created_at, updated_at
	FROM cv_definitions
	WHERE id = ?
	`
		)
		.get(id) as CvDefinitionRow | undefined;

	return row ?? null;
}

/** Returns the CV definition tree for the given owner. */
export function getCvDefinitionTreeByOwner(db: Db, ownerType: CvOwnerType, ownerId: string): CvDefinitionTreeNode[] {
	const rows = listCvDefinitionsByOwner(db, ownerType, ownerId);
	return buildCvDefinitionTree(rows);
}

/** Updates mutable fields of an existing CV definition row. */
export function updateCvDefinitionRow(
	db: Db,
	params: {
		id: string;
		parentId: string | null;
		sortOrder: number;
		name: string;
		description: string | null;
		config: unknown;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
    UPDATE cv_definitions
    SET
      parent_id = ?,
      sort_order = ?,
      name = ?,
      description = ?,
      config_json = ?,
      updated_at = ?
    WHERE id = ?
  `
	).run(params.parentId, params.sortOrder, params.name, params.description, JSON.stringify(params.config), now, params.id);
}

/** Deletes a CV definition row by id. */
export function deleteCvDefinitionRow(db: Db, id: string): void {
	db.prepare(
		`
    DELETE FROM cv_definitions
    WHERE id = ?
  `
	).run(id);
}

/** Moves a CV definition row to a new parent and sort order. */
export function moveCvDefinitionRow(
	db: Db,
	params: {
		id: string;
		parentId: string | null;
		sortOrder: number;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
    UPDATE cv_definitions
    SET
      parent_id = ?,
      sort_order = ?,
      updated_at = ?
    WHERE id = ?
  `
	).run(params.parentId, params.sortOrder, now, params.id);
}

/** Lists direct child CV definition rows for a given parent id. */
export function listChildCvDefinitions(db: Db, parentId: string): CvDefinitionRow[] {
	return db
		.prepare(
			`
    SELECT
      id,
      owner_type,
      owner_id,
      parent_id,
      sort_order,
      key,
      type,
      name,
      description,
      config_json,
      created_at,
      updated_at
    FROM cv_definitions
    WHERE parent_id = ?
    ORDER BY sort_order, name
  `
		)
		.all(parentId) as CvDefinitionRow[];
}

/** Lists sibling CV definitions for the given owner and parent scope. */
export function listSiblingCvDefinitions(
	db: Db,
	params: {
		ownerType: 'family' | 'decoder';
		ownerId: string;
		parentId: string | null;
	}
): CvDefinitionRow[] {
	if (params.parentId === null) {
		return db
			.prepare(
				`
      SELECT
        id,
        owner_type,
        owner_id,
        parent_id,
        sort_order,
        key,
        type,
        name,
        description,
        config_json,
        created_at,
        updated_at
      FROM cv_definitions
      WHERE owner_type = ?
        AND owner_id = ?
        AND parent_id IS NULL
      ORDER BY sort_order, name
    `
			)
			.all(params.ownerType, params.ownerId) as CvDefinitionRow[];
	}

	return db
		.prepare(
			`
    SELECT
      id,
      owner_type,
      owner_id,
      parent_id,
      sort_order,
      key,
      type,
      name,
      description,
      config_json,
      created_at,
      updated_at
    FROM cv_definitions
    WHERE owner_type = ?
      AND owner_id = ?
      AND parent_id = ?
    ORDER BY sort_order, name
  `
		)
		.all(params.ownerType, params.ownerId, params.parentId) as CvDefinitionRow[];
}

/** Updates only the sort order of a CV definition row. */
export function updateCvDefinitionSortOrderRow(
	db: Db,
	params: {
		id: string;
		sortOrder: number;
	}
): void {
	const now = nowIso();

	db.prepare(
		`
    UPDATE cv_definitions
    SET
      sort_order = ?,
      updated_at = ?
    WHERE id = ?
  `
	).run(params.sortOrder, now, params.id);
}
