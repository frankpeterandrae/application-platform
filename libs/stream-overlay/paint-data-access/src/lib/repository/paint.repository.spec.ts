/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '@application-platform/data-db';
import { type Paint, PaintColorGroup } from '@application-platform/paint';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaintSnapshotService } from '../service/paint-snapshot.service';

import { PaintRepository } from './paint.repository';

describe('PaintRepository', () => {
	let db: Db;
	let repository: PaintRepository;
	let paintSnapshotService: PaintSnapshotService;

	const markDirty = vi.fn();

	const paint: Paint = {
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		range: 'Base',
		category: 'Layer',
		colorGroups: [PaintColorGroup.Red],
		mainColor: '#991115',
		secondaryColor: '#550000',
		barcode: '5011921027964'
	};

	beforeEach(() => {
		db = new Database(':memory:');

		db.pragma('foreign_keys = ON');

		createSchema(db);

		paintSnapshotService = {
			markDirty
		} as unknown as PaintSnapshotService;

		repository = new PaintRepository(db, paintSnapshotService);

		markDirty.mockClear();
	});

	afterEach(() => {
		db.close();
	});

	describe('findAll', () => {
		it('should return all paints ordered by name', () => {
			insertBrand(db, 'citadel');

			repository.insert({
				...paint,
				id: 'citadel:2',
				sku: '2',
				name: 'Zandri Dust'
			});

			repository.insert({
				...paint,
				id: 'citadel:1',
				sku: '1',
				name: 'Abaddon Black'
			});

			const result = repository.findAll();

			expect(result.map((item) => item.name)).toEqual(['Abaddon Black', 'Zandri Dust']);
		});

		it('should map optional fields and color groups', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			const result = repository.findAll();

			expect(result).toEqual([paint]);
		});

		it('should return empty colorGroups when no groups exist', () => {
			insertBrand(db, 'citadel');

			repository.insert({
				...paint,
				colorGroups: []
			});

			const result = repository.findAll();

			expect(result[0]?.colorGroups).toEqual([]);
		});

		it('should omit nullable optional fields', () => {
			insertBrand(db, 'citadel');

			const minimalPaint: Paint = {
				id: 'citadel:21-04',
				brand: 'citadel',
				sku: '21-04',
				name: 'Test Paint',
				colorGroups: [],
				mainColor: '#123456'
			};

			repository.insert(minimalPaint);

			const result = repository.findAll()[0];

			expect(result).toEqual(minimalPaint);
			expect(result).not.toHaveProperty('range');
			expect(result).not.toHaveProperty('category');
			expect(result).not.toHaveProperty('secondaryColor');
			expect(result).not.toHaveProperty('barcode');
		});
	});

	describe('findById', () => {
		it('should return paint by id', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			expect(repository.findById(paint.id)).toEqual(paint);
		});

		it('should return undefined when paint does not exist', () => {
			expect(repository.findById('citadel:missing')).toBeUndefined();
		});
	});

	describe('findByBrand', () => {
		it('should return only paints for the requested brand', () => {
			insertBrand(db, 'citadel');
			insertBrand(db, 'vallejo');

			repository.insert(paint);

			repository.insert({
				...paint,
				id: 'vallejo:001',
				brand: 'vallejo',
				sku: '001',
				name: 'Vallejo Red'
			});

			const result = repository.findByBrand('citadel');

			expect(result).toHaveLength(1);
			expect(result[0]?.brand).toBe('citadel');
		});
	});

	describe('insert', () => {
		it('should insert paint and color groups', () => {
			insertBrand(db, 'citadel');

			const paintWithGroups: Paint = {
				...paint,
				colorGroups: [PaintColorGroup.Metallic, PaintColorGroup.Red]
			};

			repository.insert(paintWithGroups);

			expect(repository.findById(paint.id)).toEqual(paintWithGroups);
		});

		it('should mark snapshot dirty after successful insert', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			expect(markDirty).toHaveBeenCalledTimes(1);
		});

		it('should rollback paint insert when color group insert fails', () => {
			insertBrand(db, 'citadel');

			const invalidPaint = {
				...paint,
				colorGroups: ['invalid']
			} as unknown as Paint;

			expect(() => repository.insert(invalidPaint)).toThrow();

			expect(repository.findById(paint.id)).toBeUndefined();

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update paint data', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			markDirty.mockClear();

			const updated: Paint = {
				...paint,
				name: 'Updated Paint',
				mainColor: '#112233'
			};

			repository.update(updated);

			expect(repository.findById(paint.id)).toEqual(updated);
		});

		it('should replace color groups', () => {
			insertBrand(db, 'citadel');

			repository.insert({
				...paint,
				colorGroups: [PaintColorGroup.Red, PaintColorGroup.Brown]
			});

			repository.update({
				...paint,
				colorGroups: [PaintColorGroup.Metallic]
			});

			expect(repository.findById(paint.id)?.colorGroups).toEqual([PaintColorGroup.Metallic]);
		});

		it('should throw when paint does not exist', () => {
			insertBrand(db, 'citadel');

			expect(() => repository.update(paint)).toThrow(`Paint not found: ${paint.id}`);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('should rollback update when color group insert fails', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			markDirty.mockClear();

			const invalidPaint = {
				...paint,
				name: 'Should not persist',
				colorGroups: ['invalid']
			} as unknown as Paint;

			expect(() => repository.update(invalidPaint)).toThrow();

			expect(repository.findById(paint.id)).toEqual(paint);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('should mark snapshot dirty after successful update', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			markDirty.mockClear();

			repository.update({
				...paint,
				name: 'Updated Paint'
			});

			expect(markDirty).toHaveBeenCalledTimes(1);
		});
	});

	describe('delete', () => {
		it('should delete paint', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			markDirty.mockClear();

			repository.delete(paint.id);

			expect(repository.findById(paint.id)).toBeUndefined();
		});

		it('should cascade delete color groups', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			repository.delete(paint.id);

			const groups = db
				.prepare(
					`
					SELECT *
					FROM paint_color_group
					WHERE paint_id = ?
				`
				)
				.all(paint.id);

			expect(groups).toEqual([]);
		});

		it('should throw when paint does not exist', () => {
			expect(() => repository.delete('citadel:missing')).toThrow('Paint not found: citadel:missing');

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('should mark snapshot dirty after successful delete', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			markDirty.mockClear();

			repository.delete(paint.id);

			expect(markDirty).toHaveBeenCalledTimes(1);
		});
	});

	describe('deleteAll', () => {
		it('should delete all paints and color groups', () => {
			insertBrand(db, 'citadel');

			repository.insert(paint);

			markDirty.mockClear();

			repository.deleteAll();

			expect(repository.findAll()).toEqual([]);

			const groups = db
				.prepare(
					`
					SELECT *
					FROM paint_color_group
				`
				)
				.all();

			expect(groups).toEqual([]);
		});

		it('should mark snapshot dirty', () => {
			repository.deleteAll();

			expect(markDirty).toHaveBeenCalledTimes(1);
		});
	});
});

function insertBrand(db: Db, id: string): void {
	db.prepare(
		`
		INSERT INTO paint_brand (
			id,
			name
		)
		VALUES (?, ?)
	`
	).run(id, id);
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
			range TEXT,
			category TEXT,
			main_color TEXT NOT NULL,
			secondary_color TEXT,
			barcode TEXT,

			FOREIGN KEY (brand_id)
				REFERENCES paint_brand(id)
				ON DELETE CASCADE
		);

		CREATE TABLE paint_color_group (
			paint_id TEXT NOT NULL,
			color_group TEXT NOT NULL
				CHECK (
					color_group IN (
						'red',
						'yellow',
						'orange',
						'green',
						'blue',
						'purple',
						'pink',
						'skintones',
						'brown',
						'ivory',
						'black-to-white',
						'metallic',
						'technical',
						'glaze',
						'inks',
						'washes'
					)
				),

			PRIMARY KEY (
				paint_id,
				color_group
			),

			FOREIGN KEY (paint_id)
				REFERENCES paint(id)
				ON DELETE CASCADE
		);
	`);
}
