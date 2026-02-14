/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import Database from 'better-sqlite3';

import type { Db } from '../db';
import { createCvDefinitionOverride } from '../repos/programming/cv-definition-overrides.repo';
import { createCvDefinition } from '../repos/programming/cv-definitions.repo';

import { getEffectiveCvDefinitionTreeForDecoder } from './effective-cv-definition-tree';

function createSchema(db: Db): void {
	db.exec(`
		CREATE TABLE cv_definitions (
			id TEXT PRIMARY KEY,
			owner_type TEXT NOT NULL,
			owner_id TEXT NOT NULL,
			parent_id TEXT NULL,
			sort_order INTEGER NOT NULL,
			key TEXT NOT NULL,
			type TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT NULL,
			config_json TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);

		CREATE TABLE cv_definition_overrides (
			id TEXT PRIMARY KEY,
			decoder_id TEXT NOT NULL,
			base_definition_id TEXT NOT NULL,
			is_disabled INTEGER NOT NULL,
			patch_json TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);
}

describe('getEffectiveCvDefinitionTreeForDecoder', () => {
	let db: Db;

	beforeEach(() => {
		db = new Database(':memory:');
		createSchema(db);
	});

	afterEach(() => {
		db.close();
	});

	it('merges family definitions, applies overrides, and keeps decoder additions', () => {
		createCvDefinition(db, {
			id: 'family-root',
			ownerType: 'family',
			ownerId: 'family-1',
			key: 'root',
			type: 'folder',
			name: 'Root',
			config: {},
			sortOrder: 10
		});
		createCvDefinition(db, {
			id: 'family-speed',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'family-root',
			key: 'speed',
			type: 'cv_number',
			name: 'Speed',
			config: { cv: 1, min: 0, max: 255, default: 20 },
			sortOrder: 20
		});
		createCvDefinition(db, {
			id: 'family-light',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'family-root',
			key: 'light',
			type: 'cv_boolean',
			name: 'Light',
			config: { cv: 2, bit: 1, default: false },
			sortOrder: 10
		});
		createCvDefinition(db, {
			id: 'decoder-mode',
			ownerType: 'decoder',
			ownerId: 'decoder-1',
			parentId: 'family-root',
			key: 'mode',
			type: 'cv_select',
			name: 'Mode',
			config: {
				cv: 29,
				options: [
					{ value: 0, label: 'Off' },
					{ value: 1, label: 'On' }
				],
				default: 1
			},
			sortOrder: 15
		});

		createCvDefinitionOverride(db, {
			id: 'override-speed',
			decoderId: 'decoder-1',
			baseDefinitionId: 'family-speed',
			patch: {
				name: 'Top Speed',
				sortOrder: 5,
				config: { default: 50 }
			}
		});
		createCvDefinitionOverride(db, {
			id: 'override-light',
			decoderId: 'decoder-1',
			baseDefinitionId: 'family-light',
			isDisabled: true,
			patch: {}
		});

		const tree = getEffectiveCvDefinitionTreeForDecoder(db, 'family-1', 'decoder-1');

		expect(tree).toHaveLength(1);
		expect(tree[0]?.id).toBe('family-root');
		expect(tree[0]?.children.map((node) => node.id)).toEqual(['family-speed', 'decoder-mode']);
		expect(tree[0]?.children[0]).toMatchObject({
			name: 'Top Speed',
			sortOrder: 5,
			ownerType: 'family'
		});
		expect(tree[0]?.children[0]?.config).toEqual({ cv: 1, min: 0, max: 255, default: 50 });
		expect(tree[0]?.children[1]).toMatchObject({
			id: 'decoder-mode',
			ownerType: 'decoder'
		});
	});

	it('throws when an override references a base definition outside the family rows', () => {
		createCvDefinition(db, {
			id: 'other-family-root',
			ownerType: 'family',
			ownerId: 'family-2',
			key: 'root-2',
			type: 'folder',
			name: 'Other Root',
			config: {}
		});

		createCvDefinitionOverride(db, {
			id: 'override-invalid-base',
			decoderId: 'decoder-1',
			baseDefinitionId: 'other-family-root',
			patch: {}
		});

		expect(() => getEffectiveCvDefinitionTreeForDecoder(db, 'family-1', 'decoder-1')).toThrow('die nicht zur Decoder-Familie gehört');
	});

	it('throws when merged family and decoder definitions contain duplicate keys', () => {
		createCvDefinition(db, {
			id: 'family-root',
			ownerType: 'family',
			ownerId: 'family-1',
			key: 'root',
			type: 'folder',
			name: 'Root',
			config: {}
		});
		createCvDefinition(db, {
			id: 'family-speed',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'family-root',
			key: 'shared-key',
			type: 'cv_number',
			name: 'Speed',
			config: { cv: 1, min: 0, max: 255 }
		});
		createCvDefinition(db, {
			id: 'decoder-speed',
			ownerType: 'decoder',
			ownerId: 'decoder-1',
			parentId: 'family-root',
			key: 'shared-key',
			type: 'cv_boolean',
			name: 'Decoder Speed Flag',
			config: { cv: 2, bit: 0 }
		});

		expect(() => getEffectiveCvDefinitionTreeForDecoder(db, 'family-1', 'decoder-1')).toThrow('Doppelter effektiver CV-Definition-Key');
	});

	it('throws when a decoder row contains invalid config_json', () => {
		createCvDefinition(db, {
			id: 'family-root',
			ownerType: 'family',
			ownerId: 'family-1',
			key: 'root',
			type: 'folder',
			name: 'Root',
			config: {}
		});

		db.prepare(
			`
			INSERT INTO cv_definitions (id, owner_type, owner_id, parent_id, sort_order, key, type, name, description, config_json, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		).run(
			'decoder-row',
			'decoder',
			'decoder-1',
			'family-root',
			10,
			'mode',
			'cv_select',
			'Mode',
			null,
			'{',
			'2026-01-01T00:00:00.000Z',
			'2026-01-01T00:00:00.000Z'
		);

		expect(() => getEffectiveCvDefinitionTreeForDecoder(db, 'family-1', 'decoder-1')).toThrow(
			'CV-Definition "decoder-row" enthält ungültiges JSON in config_json.'
		);
	});
});
