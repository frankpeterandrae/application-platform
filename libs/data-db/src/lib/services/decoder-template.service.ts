/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db, withTx } from '../db';
import type { CvDefinitionOverridePatch } from '../programming/cv-definition-overrides';
import type { CvDefinitionTreeNode } from '../programming/cv-definition-tree';
import { parseCvBooleanConfig, parseCvNumberConfig, parseCvSelectConfig, parseFolderConfig } from '../programming/cv-definition-types';
import { getEffectiveCvDefinitionTreeForDecoder } from '../programming/effective-cv-definition-tree';
import { deepMerge } from '../programming/object-merge';
import {
	createCvDefinitionOverride,
	deleteCvDefinitionOverrideRow,
	getCvDefinitionOverrideById,
	listCvDefinitionOverridesByBaseDefinition,
	updateCvDefinitionOverrideRow
} from '../repos/programming/cv-definition-overrides.repo';
import {
	createCvDefinition,
	deleteCvDefinitionRow,
	getCvDefinitionById,
	getCvDefinitionTreeByOwner,
	listChildCvDefinitions,
	listCvDefinitionsByOwner,
	listSiblingCvDefinitions,
	moveCvDefinitionRow,
	updateCvDefinitionRow,
	updateCvDefinitionSortOrderRow,
	type CreateCvDefinitionParams
} from '../repos/programming/cv-definitions.repo';
import { createDecoderFamily, getDecoderFamilyById, listDecoderFamiliesByManufacturer } from '../repos/programming/decoder-families.repo';
import { createDecoder, getDecoderById, listDecodersByFamily } from '../repos/programming/decoder.repo';
import { createManufacturer, getManufacturerById, listManufacturers } from '../repos/programming/manufacturers.repo';

/** Asserts that a nullable value exists and returns it. */
function assertExists<T>(value: T | null, message: string): T {
	if (!value) {
		throw new Error(message);
	}

	return value;
}

/** Creates a manufacturer template entity. */
export function createManufacturerTemplate(
	db: Db,
	params: {
		id: string;
		name: string;
	}
): void {
	createManufacturer(db, params);
}

/** Returns all manufacturer templates. */
export function getManufacturers(db: Db): ReturnType<typeof listManufacturers> {
	return listManufacturers(db);
}

/** Creates a decoder family template for an existing manufacturer. */
export function createDecoderFamilyTemplate(
	db: Db,
	params: {
		id: string;
		manufacturerId: string;
		name: string;
		description?: string | null;
	}
): void {
	const manufacturer = getManufacturerById(db, params.manufacturerId);
	assertExists(manufacturer, `Hersteller "${params.manufacturerId}" wurde nicht gefunden.`);

	createDecoderFamily(db, {
		...params,
		description: params.description ?? undefined
	});
}

/** Returns all decoder family templates for a manufacturer. */
export function getDecoderFamiliesForManufacturer(db: Db, manufacturerId: string): ReturnType<typeof listDecoderFamiliesByManufacturer> {
	const manufacturer = getManufacturerById(db, manufacturerId);
	assertExists(manufacturer, `Hersteller "${manufacturerId}" wurde nicht gefunden.`);

	return listDecoderFamiliesByManufacturer(db, manufacturerId);
}

/** Creates a decoder template for an existing decoder family. */
export function createDecoderTemplate(
	db: Db,
	params: {
		id: string;
		familyId: string;
		name: string;
		description?: string | null;
	}
): void {
	const family = getDecoderFamilyById(db, params.familyId);
	assertExists(family, `Decoder-Familie "${params.familyId}" wurde nicht gefunden.`);

	createDecoder(db, params);
}

/** Returns all decoder templates for a decoder family. */
export function getDecodersForFamily(db: Db, familyId: string): ReturnType<typeof listDecodersByFamily> {
	const family = getDecoderFamilyById(db, familyId);
	assertExists(family, `Decoder-Familie "${familyId}" wurde nicht gefunden.`);

	return listDecodersByFamily(db, familyId);
}

/** Adds a folder CV definition to a family or decoder owner. */
export function addCvFolder(
	db: Db,
	params: {
		id: string;
		ownerType: 'family' | 'decoder';
		ownerId: string;
		parentId?: string | null;
		position?: number;
		key: string;
		name: string;
		description?: string | null;
	}
): void {
	withTx(db, () => {
		assertOwnerExists(db, params.ownerType, params.ownerId);

		if (params.parentId) {
			assertParentExistsForOwner(db, params.ownerType, params.ownerId, params.parentId);
		}

		createCvDefinition(db, {
			id: params.id,
			ownerType: params.ownerType,
			ownerId: params.ownerId,
			parentId: params.parentId ?? null,
			sortOrder: 999999,
			key: params.key,
			type: 'folder',
			name: params.name,
			description: params.description ?? null,
			config: {}
		});

		insertNewDefinitionIntoPosition(db, {
			id: params.id,
			ownerType: params.ownerType,
			ownerId: params.ownerId,
			parentId: params.parentId ?? null,
			position: params.position
		});
	});
}

/** Adds a typed CV definition to a family or decoder owner. */
export function addCvDefinition(
	db: Db,
	params: CreateCvDefinitionParams & {
		position?: number;
	}
): void {
	withTx(db, () => {
		assertOwnerExists(db, params.ownerType, params.ownerId);

		if (params.parentId) {
			assertParentExistsForOwner(db, params.ownerType, params.ownerId, params.parentId);
		}

		assertKeyIsAllowed(db, params.ownerType, params.ownerId, params.key);

		createCvDefinition(db, {
			...params,
			sortOrder: 999999
		});

		insertNewDefinitionIntoPosition(db, {
			id: params.id,
			ownerType: params.ownerType,
			ownerId: params.ownerId,
			parentId: params.parentId ?? null,
			position: params.position
		});
	});
}

/** Adds a decoder-specific override for a family base definition. */
export function addCvDefinitionOverride(
	db: Db,
	params: {
		id: string;
		decoderId: string;
		baseDefinitionId: string;
		isDisabled?: boolean;
		patch: CvDefinitionOverridePatch;
	}
): void {
	const decoder = getDecoderById(db, params.decoderId);
	const ensuredDecoder = assertExists(decoder, `Decoder "${params.decoderId}" wurde nicht gefunden.`);

	const baseDefinition = getCvDefinitionById(db, params.baseDefinitionId);
	const ensuredBaseDefinition = assertExists(baseDefinition, `Basisdefinition "${params.baseDefinitionId}" wurde nicht gefunden.`);

	if (ensuredBaseDefinition.owner_type !== 'family') {
		throw new Error(`Basisdefinition "${params.baseDefinitionId}" ist keine Familien-Definition.`);
	}

	if (ensuredBaseDefinition.owner_id !== ensuredDecoder.family_id) {
		throw new Error(`Basisdefinition "${params.baseDefinitionId}" gehört nicht zur Familie des Decoders "${params.decoderId}".`);
	}

	createCvDefinitionOverride(db, params);
}

/** Returns the CV definition tree for a decoder family template. */
export function getCvDefinitionTreeForFamilyTemplate(db: Db, familyId: string): CvDefinitionTreeNode[] {
	const family = getDecoderFamilyById(db, familyId);
	assertExists(family, `Decoder-Familie "${familyId}" wurde nicht gefunden.`);

	return getCvDefinitionTreeByOwner(db, 'family', familyId);
}

/** Returns the effective CV definition tree for a decoder template. */
export function getCvDefinitionTreeForDecoderTemplate(db: Db, decoderId: string): CvDefinitionTreeNode[] {
	const decoder = getDecoderById(db, decoderId);
	const ensuredDecoder = assertExists(decoder, `Decoder "${decoderId}" wurde nicht gefunden.`);

	return getEffectiveCvDefinitionTreeForDecoder(db, ensuredDecoder.family_id, decoderId);
}

/** Ensures that the provided owner id exists for the owner type. */
function assertOwnerExists(db: Db, ownerType: 'family' | 'decoder', ownerId: string): void {
	if (ownerType === 'family') {
		const family = getDecoderFamilyById(db, ownerId);
		assertExists(family, `Decoder-Familie "${ownerId}" wurde nicht gefunden.`);
		return;
	}

	const decoder = getDecoderById(db, ownerId);
	assertExists(decoder, `Decoder "${ownerId}" wurde nicht gefunden.`);
}

/** Ensures that a candidate parent definition exists and is valid for the owner scope. */
function assertParentExistsForOwner(db: Db, ownerType: 'family' | 'decoder', ownerId: string, parentId: string): void {
	const parent = getCvDefinitionById(db, parentId);
	const ensuredParent = assertExists(parent, `Parent-Definition "${parentId}" wurde nicht gefunden.`);

	if (ensuredParent.type !== 'folder') {
		throw new Error(`Parent-Definition "${parentId}" ist kein folder.`);
	}

	if (ownerType === 'family') {
		if (ensuredParent.owner_type !== 'family' || ensuredParent.owner_id !== ownerId) {
			throw new Error(`Parent-Definition "${parentId}" gehört nicht zur Decoder-Familie "${ownerId}".`);
		}

		return;
	}

	const decoder = getDecoderById(db, ownerId);
	const ensuredDecoder = assertExists(decoder, `Decoder "${ownerId}" wurde nicht gefunden.`);

	const parentBelongsToDecoder = ensuredParent.owner_type === 'decoder' && ensuredParent.owner_id === ownerId;

	const parentBelongsToFamily = ensuredParent.owner_type === 'family' && ensuredParent.owner_id === ensuredDecoder.family_id;

	if (!parentBelongsToDecoder && !parentBelongsToFamily) {
		throw new Error(`Parent-Definition "${parentId}" darf für Decoder "${ownerId}" nicht verwendet werden.`);
	}
}

/** Enforces key uniqueness within the owner and, for decoder owners, against their family definitions. */
function assertKeyIsAllowed(db: Db, ownerType: 'family' | 'decoder', ownerId: string, key: string): void {
	const ownDefinitions = listCvDefinitionsByOwner(db, ownerType, ownerId);

	if (ownDefinitions.some((definition) => definition.key === key)) {
		throw new Error(`Der Key "${key}" existiert bereits für ${ownerType} "${ownerId}".`);
	}

	if (ownerType === 'decoder') {
		const decoder = getDecoderById(db, ownerId);
		const ensuredDecoder = assertExists(decoder, `Decoder "${ownerId}" wurde nicht gefunden.`);

		const familyDefinitions = listCvDefinitionsByOwner(db, 'family', ensuredDecoder.family_id);

		if (familyDefinitions.some((definition) => definition.key === key)) {
			throw new Error(`Der Key "${key}" existiert bereits in der Familie des Decoders "${ownerId}".`);
		}
	}
}

/** Updates an existing CV definition while validating parent, config, and cycle constraints. */
export function updateCvDefinition(
	db: Db,
	params: {
		id: string;
		parentId: string | null;
		sortOrder: number;
		name: string;
		description?: string | null;
		config: unknown;
	}
): void {
	const definition = getCvDefinitionById(db, params.id);
	const ensuredDefinition = assertExists(definition, `CV-Definition "${params.id}" wurde nicht gefunden.`);

	validateConfigForExistingDefinitionType(ensuredDefinition.type, params.config);

	if (params.parentId) {
		assertParentIsAllowedForExistingDefinition(db, ensuredDefinition, params.parentId);
	}

	assertMoveDoesNotCreateCycle(db, ensuredDefinition.id, params.parentId);

	updateCvDefinitionRow(db, {
		id: params.id,
		parentId: params.parentId,
		sortOrder: params.sortOrder,
		name: params.name,
		description: params.description ?? null,
		config: params.config
	});
}

/** Validates config against the existing definition type. */
function validateConfigForExistingDefinitionType(type: 'folder' | 'cv_number' | 'cv_boolean' | 'cv_select', config: unknown): void {
	switch (type) {
		case 'folder':
			parseFolderConfig(config);
			return;
		case 'cv_number':
			parseCvNumberConfig(config);
			return;
		case 'cv_boolean':
			parseCvBooleanConfig(config);
			return;
		case 'cv_select':
			parseCvSelectConfig(config);
			return;
		default: {
			throw new Error(`Unbekannter CV-Definition-Typ: ${type}`);
		}
	}
}

/** Ensures a parent reference is valid for the owner of an existing definition. */
function assertParentIsAllowedForExistingDefinition(
	db: Db,
	definition: {
		id: string;
		owner_type: 'family' | 'decoder';
		owner_id: string;
	},
	parentId: string
): void {
	if (definition.owner_type === 'family') {
		assertParentExistsForOwner(db, 'family', definition.owner_id, parentId);
		return;
	}

	assertParentExistsForOwner(db, 'decoder', definition.owner_id, parentId);
}

/** Prevents re-parenting operations that would introduce a cycle. */
function assertMoveDoesNotCreateCycle(db: Db, definitionId: string, newParentId: string | null): void {
	if (!newParentId) {
		return;
	}

	if (definitionId === newParentId) {
		throw new Error(`CV-Definition "${definitionId}" kann nicht ihr eigener Parent sein.`);
	}

	let currentParentId: string | null = newParentId;

	while (currentParentId) {
		if (currentParentId === definitionId) {
			throw new Error(`Verschieben von "${definitionId}" würde einen Zyklus erzeugen.`);
		}

		const currentParent = getCvDefinitionById(db, currentParentId);
		const ensuredParent: { parent_id: string | null } = assertExists(
			currentParent,
			`Parent-Definition "${currentParentId}" wurde nicht gefunden.`
		);

		currentParentId = ensuredParent.parent_id;
	}
}

/** Moves an existing CV definition to a new parent and sort order. */
export function moveCvDefinitionToPosition(
	db: Db,
	params: {
		id: string;
		parentId: string | null;
		position: number;
	}
): void {
	withTx(db, () => {
		const definition = getCvDefinitionById(db, params.id);
		const ensuredDefinition = assertExists(definition, `CV-Definition "${params.id}" wurde nicht gefunden.`);

		if (params.parentId) {
			assertParentIsAllowedForExistingDefinition(db, ensuredDefinition, params.parentId);
		}

		assertMoveDoesNotCreateCycle(db, ensuredDefinition.id, params.parentId);

		const oldParentId = ensuredDefinition.parent_id;
		const ownerType = ensuredDefinition.owner_type;
		const ownerId = ensuredDefinition.owner_id;

		moveCvDefinitionRow(db, {
			id: ensuredDefinition.id,
			parentId: params.parentId,
			sortOrder: 999999
		});

		const newSiblings = listSiblingCvDefinitions(db, {
			ownerType,
			ownerId,
			parentId: params.parentId
		});

		const reorderedIds = reorderSiblingIds(
			newSiblings.map((sibling) => sibling.id),
			ensuredDefinition.id,
			params.position
		);

		applySiblingOrder(db, reorderedIds);

		if (oldParentId !== params.parentId) {
			normalizeSiblingSortOrder(db, {
				ownerType,
				ownerId,
				parentId: oldParentId
			});
		}
	});
}

/** Deletes a CV definition when it has no children and no dependent overrides. */
export function deleteCvDefinition(db: Db, id: string): void {
	withTx(db, () => {
		const definition = getCvDefinitionById(db, id);
		const ensuredDefinition = assertExists(definition, `CV-Definition "${id}" wurde nicht gefunden.`);

		const children = listChildCvDefinitions(db, id);
		if (children.length > 0) {
			throw new Error(`CV-Definition "${id}" kann nicht gelöscht werden, weil noch ${children.length} Kind-Element(e) existieren.`);
		}

		if (ensuredDefinition.owner_type === 'family') {
			const overrides = listCvDefinitionOverridesByBaseDefinition(db, id);

			if (overrides.length > 0) {
				throw new Error(
					`CV-Definition "${id}" kann nicht gelöscht werden, weil noch ${overrides.length} Override(s) darauf verweisen.`
				);
			}
		}

		deleteCvDefinitionRow(db, id);
	});
}

/** Updates an override and validates patch compatibility with its base definition. */
export function updateCvDefinitionOverride(
	db: Db,
	params: {
		id: string;
		isDisabled: boolean;
		patch: CvDefinitionOverridePatch;
	}
): void {
	const override = getCvDefinitionOverrideById(db, params.id);
	const ensuredOverride = assertExists(override, `Override "${params.id}" wurde nicht gefunden.`);

	const baseDefinition = getCvDefinitionById(db, ensuredOverride.base_definition_id);
	const ensuredBaseDefinition = assertExists(
		baseDefinition,
		`Basisdefinition "${ensuredOverride.base_definition_id}" wurde nicht gefunden.`
	);

	validateOverridePatchAgainstDefinition(ensuredBaseDefinition, params.patch);

	updateCvDefinitionOverrideRow(db, params);
}

/** Validates override patch fields and merged config against base definition type. */
function validateOverridePatchAgainstDefinition(
	baseDefinition: {
		id: string;
		type: 'folder' | 'cv_number' | 'cv_boolean' | 'cv_select';
		config_json: string;
	},
	patch: CvDefinitionOverridePatch
): void {
	const allowedKeys = new Set(['name', 'description', 'sortOrder', 'config']);

	for (const key of Object.keys(patch)) {
		if (!allowedKeys.has(key)) {
			throw new Error(`Override-Patch für "${baseDefinition.id}" enthält nicht erlaubtes Feld "${key}".`);
		}
	}

	if (patch.config !== undefined) {
		let baseConfig: unknown;

		try {
			baseConfig = JSON.parse(baseDefinition.config_json);
		} catch {
			throw new Error(`Basisdefinition "${baseDefinition.id}" enthält ungültiges config_json.`);
		}

		const merged = deepMerge(baseConfig, patch.config);
		validateConfigForExistingDefinitionType(baseDefinition.type, merged);
	}
}

/** Deletes an override by id after existence check. */
export function deleteCvDefinitionOverride(db: Db, id: string): void {
	const override = getCvDefinitionOverrideById(db, id);
	assertExists(override, `Override "${id}" wurde nicht gefunden.`);

	deleteCvDefinitionOverrideRow(db, id);
}

/** Reassigns sibling sort orders to contiguous steps of ten within one parent scope. */
function normalizeSiblingSortOrder(
	db: Db,
	params: {
		ownerType: 'family' | 'decoder';
		ownerId: string;
		parentId: string | null;
	}
): void {
	const siblings = listSiblingCvDefinitions(db, params);

	let nextSortOrder = 10;

	for (const sibling of siblings) {
		if (sibling.sort_order !== nextSortOrder) {
			updateCvDefinitionSortOrderRow(db, {
				id: sibling.id,
				sortOrder: nextSortOrder
			});
		}

		nextSortOrder += 10;
	}
}

/** Clamps an insertion position into the valid sibling index range. */
function clampInsertPosition(position: number, maxLength: number): number {
	if (position < 0) {
		return 0;
	}

	if (position > maxLength) {
		return maxLength;
	}

	return position;
}

/** Rebuilds the sibling id order with one definition moved to the requested position. */
function reorderSiblingIds(siblingIds: string[], movedId: string, targetPosition: number): string[] {
	const withoutMoved = siblingIds.filter((id) => id !== movedId);
	const clampedPosition = clampInsertPosition(targetPosition, withoutMoved.length);

	withoutMoved.splice(clampedPosition, 0, movedId);

	return withoutMoved;
}

/** Persists a complete sibling order using sort-order steps of ten. */
function applySiblingOrder(db: Db, orderedIds: string[]): void {
	let sortOrder = 10;

	for (const id of orderedIds) {
		updateCvDefinitionSortOrderRow(db, {
			id,
			sortOrder
		});

		sortOrder += 10;
	}
}

/** Moves a definition to the end of its sibling list under the given parent. */
export function appendCvDefinition(
	db: Db,
	params: {
		id: string;
		parentId: string | null;
	}
): void {
	const definition = getCvDefinitionById(db, params.id);
	const ensuredDefinition = assertExists(definition, `CV-Definition "${params.id}" wurde nicht gefunden.`);

	const siblings = listSiblingCvDefinitions(db, {
		ownerType: ensuredDefinition.owner_type,
		ownerId: ensuredDefinition.owner_id,
		parentId: params.parentId
	});

	moveCvDefinitionToPosition(db, {
		id: params.id,
		parentId: params.parentId,
		position: siblings.length
	});
}

/** Moves a definition to an explicit position within the target sibling list. */
export function insertCvDefinitionAtPosition(
	db: Db,
	params: {
		id: string;
		parentId: string | null;
		position: number;
	}
): void {
	moveCvDefinitionToPosition(db, params);
}

/** Inserts a newly created definition into the desired sibling position. */
function insertNewDefinitionIntoPosition(
	db: Db,
	params: {
		id: string;
		ownerType: 'family' | 'decoder';
		ownerId: string;
		parentId: string | null;
		position?: number;
	}
): void {
	const siblings = listSiblingCvDefinitions(db, {
		ownerType: params.ownerType,
		ownerId: params.ownerId,
		parentId: params.parentId
	});

	const ids = siblings.map((sibling) => sibling.id);
	const targetPosition = params.position === undefined ? Math.max(0, ids.length - 1) : params.position;

	const reorderedIds = reorderSiblingIds(ids, params.id, targetPosition);
	applySiblingOrder(db, reorderedIds);
}
