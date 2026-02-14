/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionOverridePatch } from '../../programming/cv-definition-overrides';
import type { CreateCvDefinitionParams } from '../../repos/programming/cv-definitions.repo';

export type CreateManufacturerDto = {
	id: string;
	name: string;
};

export type CreateDecoderFamilyDto = {
	id: string;
	manufacturerId: string;
	name: string;
	description?: string | null;
};

export type CreateDecoderDto = {
	id: string;
	familyId: string;
	name: string;
	description?: string | null;
};

export type AddCvFolderDto = {
	id: string;
	ownerType: 'family' | 'decoder';
	ownerId: string;
	parentId?: string | null;
	position?: number;
	key: string;
	name: string;
	description?: string | null;
};

export type AddCvDefinitionDto = CreateCvDefinitionParams & {
	position?: number;
};

export type UpdateCvDefinitionDto = {
	id: string;
	parentId: string | null;
	sortOrder: number;
	name: string;
	description?: string | null;
	config: unknown;
};

export type MoveCvDefinitionDto = {
	id: string;
	parentId: string | null;
	position: number;
};

export type AddCvDefinitionOverrideDto = {
	id: string;
	decoderId: string;
	baseDefinitionId: string;
	isDisabled?: boolean;
	patch: CvDefinitionOverridePatch;
};

export type UpdateCvDefinitionOverrideDto = {
	id: string;
	isDisabled: boolean;
	patch: CvDefinitionOverridePatch;
};
