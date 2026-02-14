/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '../../db';
import { CvDefinitionTreeNode } from '../../programming/cv-definition-tree';
import { getCvDefinitionOverrideById } from '../../repos/programming/cv-definition-overrides.repo';
import { getCvDefinitionById } from '../../repos/programming/cv-definitions.repo';
import {
	addCvDefinition,
	addCvDefinitionOverride,
	addCvFolder,
	createDecoderFamilyTemplate,
	createDecoderTemplate,
	createManufacturerTemplate,
	deleteCvDefinition,
	deleteCvDefinitionOverride,
	getCvDefinitionTreeForDecoderTemplate,
	getCvDefinitionTreeForFamilyTemplate,
	getDecoderFamiliesForManufacturer,
	getDecodersForFamily,
	getManufacturers,
	moveCvDefinitionToPosition,
	updateCvDefinition,
	updateCvDefinitionOverride
} from '../../services/decoder-template.service';

import { fail, ok, type ApiResponse } from './api-response';
import type {
	AddCvDefinitionDto,
	AddCvDefinitionOverrideDto,
	AddCvFolderDto,
	CreateDecoderDto,
	CreateDecoderFamilyDto,
	CreateManufacturerDto,
	MoveCvDefinitionDto,
	UpdateCvDefinitionDto,
	UpdateCvDefinitionOverrideDto
} from './decoder-template.dto';

/**
 *
 */
export function handleCreateManufacturer(
	db: Db,
	dto: CreateManufacturerDto
): ApiResponse<{ manufacturers: ReturnType<typeof getManufacturers> }> {
	try {
		createManufacturerTemplate(db, dto);

		return ok({
			manufacturers: getManufacturers(db)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleGetManufacturers(db: Db): ApiResponse<{ manufacturers: ReturnType<typeof getManufacturers> }> {
	try {
		return ok({
			manufacturers: getManufacturers(db)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleCreateDecoderFamily(
	db: Db,
	dto: CreateDecoderFamilyDto
): ApiResponse<{
	families: ReturnType<typeof getDecoderFamiliesForManufacturer>;
}> {
	try {
		createDecoderFamilyTemplate(db, dto);

		return ok({
			families: getDecoderFamiliesForManufacturer(db, dto.manufacturerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleGetDecoderFamiliesForManufacturer(
	db: Db,
	manufacturerId: string
): ApiResponse<{
	families: ReturnType<typeof getDecoderFamiliesForManufacturer>;
}> {
	try {
		return ok({
			families: getDecoderFamiliesForManufacturer(db, manufacturerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleCreateDecoder(
	db: Db,
	dto: CreateDecoderDto
): ApiResponse<{
	decoders: ReturnType<typeof getDecodersForFamily>;
}> {
	try {
		createDecoderTemplate(db, dto);

		return ok({
			decoders: getDecodersForFamily(db, dto.familyId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleGetDecodersForFamily(
	db: Db,
	familyId: string
): ApiResponse<{
	decoders: ReturnType<typeof getDecodersForFamily>;
}> {
	try {
		return ok({
			decoders: getDecodersForFamily(db, familyId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleGetFamilyTree(
	db: Db,
	familyId: string
): ApiResponse<{
	tree: ReturnType<typeof getCvDefinitionTreeForFamilyTemplate>;
}> {
	try {
		return ok({
			tree: getCvDefinitionTreeForFamilyTemplate(db, familyId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleGetDecoderTree(
	db: Db,
	decoderId: string
): ApiResponse<{
	tree: ReturnType<typeof getCvDefinitionTreeForDecoderTemplate>;
}> {
	try {
		return ok({
			tree: getCvDefinitionTreeForDecoderTemplate(db, decoderId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleAddCvFolder(db: Db, dto: AddCvFolderDto): ApiResponse<{ tree: unknown }> {
	try {
		addCvFolder(db, dto);

		return ok({
			tree: loadTreeForOwner(db, dto.ownerType, dto.ownerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleAddCvDefinition(db: Db, dto: AddCvDefinitionDto): ApiResponse<{ tree: unknown }> {
	try {
		addCvDefinition(db, dto);

		return ok({
			tree: loadTreeForOwner(db, dto.ownerType, dto.ownerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleUpdateCvDefinition(db: Db, dto: UpdateCvDefinitionDto): ApiResponse<{ tree: unknown }> {
	try {
		const owner = getOwnerOfDefinitionOrThrow(db, dto.id);

		updateCvDefinition(db, dto);

		return ok({
			tree: loadTreeForOwner(db, owner.ownerType, owner.ownerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleMoveCvDefinition(db: Db, dto: MoveCvDefinitionDto): ApiResponse<{ tree: unknown }> {
	try {
		const owner = getOwnerOfDefinitionOrThrow(db, dto.id);

		moveCvDefinitionToPosition(db, dto);

		return ok({
			tree: loadTreeForOwner(db, owner.ownerType, owner.ownerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleDeleteCvDefinition(db: Db, id: string): ApiResponse<{ tree: unknown }> {
	try {
		const owner = getOwnerOfDefinitionOrThrow(db, id);

		deleteCvDefinition(db, id);

		return ok({
			tree: loadTreeForOwner(db, owner.ownerType, owner.ownerId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleAddCvDefinitionOverride(
	db: Db,
	dto: AddCvDefinitionOverrideDto
): ApiResponse<{ tree: ReturnType<typeof getCvDefinitionTreeForDecoderTemplate> }> {
	try {
		addCvDefinitionOverride(db, dto);

		return ok({
			tree: getCvDefinitionTreeForDecoderTemplate(db, dto.decoderId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleUpdateCvDefinitionOverride(
	db: Db,
	dto: UpdateCvDefinitionOverrideDto
): ApiResponse<{ tree: ReturnType<typeof getCvDefinitionTreeForDecoderTemplate> }> {
	try {
		const decoderId = getDecoderIdOfOverrideOrThrow(db, dto.id);

		updateCvDefinitionOverride(db, dto);

		return ok({
			tree: getCvDefinitionTreeForDecoderTemplate(db, decoderId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}

/**
 *
 */
export function handleDeleteCvDefinitionOverride(
	db: Db,
	id: string
): ApiResponse<{ tree: ReturnType<typeof getCvDefinitionTreeForDecoderTemplate> }> {
	try {
		const decoderId = getDecoderIdOfOverrideOrThrow(db, id);

		deleteCvDefinitionOverride(db, id);

		return ok({
			tree: getCvDefinitionTreeForDecoderTemplate(db, decoderId)
		});
	} catch (error) {
		return fail(getErrorMessage(error));
	}
}
/**
 *
 */
function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Unbekannter Fehler.';
}

/**
 *
 */
function loadTreeForOwner(db: Db, ownerType: 'family' | 'decoder', ownerId: string): CvDefinitionTreeNode[] {
	if (ownerType === 'family') {
		return getCvDefinitionTreeForFamilyTemplate(db, ownerId);
	}

	return getCvDefinitionTreeForDecoderTemplate(db, ownerId);
}

/**
 *
 */
function getOwnerOfDefinitionOrThrow(
	db: Db,
	definitionId: string
): {
	ownerType: 'family' | 'decoder';
	ownerId: string;
} {
	const definition = getCvDefinitionById(db, definitionId);

	if (!definition) {
		throw new Error(`CV-Definition "${definitionId}" wurde nicht gefunden.`);
	}

	return {
		ownerType: definition.owner_type,
		ownerId: definition.owner_id
	};
}

/**
 *
 */
function getDecoderIdOfOverrideOrThrow(db: Db, overrideId: string): string {
	const override = getCvDefinitionOverrideById(db, overrideId);

	if (!override) {
		throw new Error(`Override "${overrideId}" wurde nicht gefunden.`);
	}

	return override.decoder_id;
}
