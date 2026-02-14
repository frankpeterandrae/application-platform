/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CvDefinitionConfigByType } from './cv-definition-types';

export type CvDefinitionOverridePatchBase = {
	name?: string;
	description?: string | null;
	sortOrder?: number;
};

export type FolderOverridePatch = CvDefinitionOverridePatchBase & {
	config?: Partial<CvDefinitionConfigByType['folder']>;
};

export type CvNumberOverridePatch = CvDefinitionOverridePatchBase & {
	config?: Partial<CvDefinitionConfigByType['cv_number']>;
};

export type CvBooleanOverridePatch = CvDefinitionOverridePatchBase & {
	config?: Partial<CvDefinitionConfigByType['cv_boolean']>;
};

export type CvSelectOverridePatch = CvDefinitionOverridePatchBase & {
	config?: Partial<CvDefinitionConfigByType['cv_select']>;
};
export type CvDefinitionOverridePatchByType = {
	folder: FolderOverridePatch;
	cv_number: CvNumberOverridePatch;
	cv_boolean: CvBooleanOverridePatch;
	cv_select: CvSelectOverridePatch;
};

export type CvDefinitionOverridePatch = FolderOverridePatch | CvNumberOverridePatch | CvBooleanOverridePatch | CvSelectOverridePatch;

export type CvDefinitionOverrideRow = {
	id: string;
	decoder_id: string;
	base_definition_id: string;
	is_disabled: number;
	patch_json: string;
	created_at: string;
	updated_at: string;
};
