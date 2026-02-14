/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectTypeOf } from 'vitest';

import type {
	CvBooleanOverridePatch,
	CvDefinitionOverridePatch,
	CvDefinitionOverridePatchByType,
	CvDefinitionOverrideRow,
	CvNumberOverridePatch,
	CvSelectOverridePatch,
	FolderOverridePatch
} from './cv-definition-overrides';

describe('cv-definition-overrides types', () => {
	it('accepts base override fields without config', () => {
		const patch: CvDefinitionOverridePatch = {
			name: 'New name',
			description: null,
			sortOrder: 20
		};

		expectTypeOf(patch.name).toEqualTypeOf<string | undefined>();
		expectTypeOf(patch.description).toEqualTypeOf<string | null | undefined>();
		expectTypeOf(patch.sortOrder).toEqualTypeOf<number | undefined>();
	});

	it('accepts typed config subsets for cv_number, cv_boolean and cv_select patches', () => {
		const numberPatch: CvNumberOverridePatch = {
			config: { min: 5, max: 200 }
		};

		const booleanPatch: CvBooleanOverridePatch = {
			config: { bit: 3, default: true }
		};

		const selectPatch: CvSelectOverridePatch = {
			config: {
				options: [
					{ value: 1, label: 'A' },
					{ value: 2, label: 'B' }
				]
			}
		};

		expectTypeOf(numberPatch.config).toEqualTypeOf<Partial<{ cv: number; min: number; max: number; default?: number }> | undefined>();
		expectTypeOf(booleanPatch.config).toEqualTypeOf<Partial<{ cv: number; bit: number; default?: boolean }> | undefined>();
		expectTypeOf(selectPatch.config).toEqualTypeOf<
			Partial<{ cv: number; options: { value: number; label: string }[]; default?: number }> | undefined
		>();
	});

	it('allows only empty folder config objects', () => {
		const validPatch: FolderOverridePatch = {
			config: {}
		};

		expectTypeOf(validPatch.config).toEqualTypeOf<FolderOverridePatch['config']>();

		const invalidPatch: FolderOverridePatch = {
			// @ts-expect-error folder config does not allow arbitrary keys
			config: { anyKey: 1 }
		};

		expectTypeOf(invalidPatch).toEqualTypeOf<FolderOverridePatch>();
	});

	it('rejects invalid value types in override fields and config', () => {
		// @ts-expect-error sortOrder must be a number
		const invalidSortOrder: CvDefinitionOverridePatch = { sortOrder: '10' };
		// @ts-expect-error name must be a string when present
		const invalidName: CvDefinitionOverridePatch = { name: 123 };
		// @ts-expect-error cv_number config.cv must be a number
		const invalidNumberConfig: CvNumberOverridePatch = { config: { cv: '1' } };

		expectTypeOf(invalidSortOrder).toEqualTypeOf<CvDefinitionOverridePatch>();
		expectTypeOf(invalidName).toEqualTypeOf<CvDefinitionOverridePatch>();
		expectTypeOf(invalidNumberConfig).toEqualTypeOf<CvNumberOverridePatch>();
	});

	it('maps override patch variants in CvDefinitionOverridePatchByType', () => {
		const map: CvDefinitionOverridePatchByType = {
			folder: { name: 'Folder' },
			cv_number: { config: { default: 42 } },
			cv_boolean: { config: { default: false } },
			cv_select: { config: { default: 2 } }
		};

		expectTypeOf(map.folder).toEqualTypeOf<FolderOverridePatch>();
		expectTypeOf(map.cv_number).toEqualTypeOf<CvNumberOverridePatch>();
		expectTypeOf(map.cv_boolean).toEqualTypeOf<CvBooleanOverridePatch>();
		expectTypeOf(map.cv_select).toEqualTypeOf<CvSelectOverridePatch>();
	});

	it('requires full persisted row shape for CvDefinitionOverrideRow', () => {
		const row: CvDefinitionOverrideRow = {
			id: 'ov-1',
			decoder_id: 'decoder-1',
			base_definition_id: 'base-1',
			is_disabled: 0,
			patch_json: '{"name":"Override"}',
			created_at: '2026-01-01T00:00:00.000Z',
			updated_at: '2026-01-01T00:00:00.000Z'
		};

		expectTypeOf(row.id).toEqualTypeOf<string>();
		expectTypeOf(row.is_disabled).toEqualTypeOf<number>();
		expectTypeOf(row.patch_json).toEqualTypeOf<string>();
	});
});
