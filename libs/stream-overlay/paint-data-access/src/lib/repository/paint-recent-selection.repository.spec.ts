/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '@application-platform/data-db';
import type { PaintId } from '@application-platform/paint';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PaintRecentSelectionRepository } from './paint-recent-selection.repository';

describe('PaintRecentSelectionRepository', () => {
	let db: Db;
	let repository: PaintRecentSelectionRepository;

	beforeEach(() => {
		db = new Database(':memory:');

		db.pragma('foreign_keys = ON');

		createSchema(db);

		repository = new PaintRecentSelectionRepository(db);
	});

	afterEach(() => {
		db.close();
	});

	it('should return an empty list when no paints were selected', () => {
		expect(repository.findRecent()).toEqual([]);
	});

	it('should return selected paints with newest first', () => {
		insertPaint(db, 'citadel:1');
		insertPaint(db, 'citadel:2');
		insertPaint(db, 'citadel:3');

		repository.select('citadel:1');
		repository.select('citadel:2');
		repository.select('citadel:3');

		expect(repository.findRecent()).toEqual(['citadel:3', 'citadel:2', 'citadel:1']);
	});

	it('should move an already selected paint to the front', () => {
		insertPaint(db, 'citadel:1');
		insertPaint(db, 'citadel:2');
		insertPaint(db, 'citadel:3');

		repository.select('citadel:1');
		repository.select('citadel:2');
		repository.select('citadel:3');

		repository.select('citadel:1');

		expect(repository.findRecent()).toEqual(['citadel:1', 'citadel:3', 'citadel:2']);
	});

	it('should keep only the eight most recent paints', () => {
		for (let index = 1; index <= 10; index++) {
			const id = `citadel:${index}` as PaintId;

			insertPaint(db, id);
			repository.select(id);
		}

		expect(repository.findRecent()).toEqual([
			'citadel:10',
			'citadel:9',
			'citadel:8',
			'citadel:7',
			'citadel:6',
			'citadel:5',
			'citadel:4',
			'citadel:3'
		]);
	});

	it('should respect a custom findRecent limit', () => {
		insertPaint(db, 'citadel:1');
		insertPaint(db, 'citadel:2');
		insertPaint(db, 'citadel:3');

		repository.select('citadel:1');
		repository.select('citadel:2');
		repository.select('citadel:3');

		expect(repository.findRecent(2)).toEqual(['citadel:3', 'citadel:2']);
	});

	it('should not create duplicate entries for the same paint', () => {
		insertPaint(db, 'citadel:1');

		repository.select('citadel:1');
		repository.select('citadel:1');

		const rows = db
			.prepare(
				`
				SELECT paint_id
				FROM paint_recent_selection
			`
			)
			.all();

		expect(rows).toHaveLength(1);

		expect(repository.findRecent()).toEqual(['citadel:1']);
	});

	it('should remove recent selection when paint is deleted', () => {
		insertPaint(db, 'citadel:1');

		repository.select('citadel:1');

		db.prepare(
			`
			DELETE FROM paint
			WHERE id = ?
		`
		).run('citadel:1');

		expect(repository.findRecent()).toEqual([]);
	});

	it('should rollback when selecting an unknown paint', () => {
		insertPaint(db, 'citadel:1');

		repository.select('citadel:1');

		expect(() => repository.select('citadel:missing')).toThrow();

		expect(repository.findRecent()).toEqual(['citadel:1']);
	});
});

function insertPaint(db: Db, id: PaintId): void {
	const [brand, sku] = id.split(':');

	db.prepare(
		`
		INSERT OR IGNORE INTO paint_brand (
			id,
			name
		)
		VALUES (?, ?)
	`
	).run(brand, brand);

	db.prepare(
		`
		INSERT INTO paint (
			id,
			brand_id,
			sku,
			name,
			main_color
		)
		VALUES (?, ?, ?, ?, ?)
	`
	).run(id, brand, sku, id, '#000000');
}

function createSchema(db: Db): void {
	db.exec(`
		CREATE TABLE paint_brand (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL
		);

		CREATE TABLE paint (
			id TEXT PRIMARY KEY NOT NULL,
			brand_id TEXT NOT NULL,
			sku TEXT NOT NULL,
			name TEXT NOT NULL,
			main_color TEXT NOT NULL,

			FOREIGN KEY (brand_id)
				REFERENCES paint_brand(id)
				ON DELETE CASCADE
		);

		CREATE TABLE paint_recent_selection (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			paint_id TEXT NOT NULL UNIQUE,

			FOREIGN KEY (paint_id)
				REFERENCES paint(id)
				ON DELETE CASCADE
		);
	`);
}
