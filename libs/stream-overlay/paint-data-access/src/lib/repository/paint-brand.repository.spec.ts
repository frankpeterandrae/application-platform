/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '@application-platform/data-db';
import type { PaintBrandDefinition } from '@application-platform/paint';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaintSnapshotService } from '../service/paint-snapshot.service';

import { PaintBrandRepository } from './paint-brand.repository';

describe('PaintBrandRepository', () => {
	let db: Db;
	let repository: PaintBrandRepository;
	let paintSnapshotService: PaintSnapshotService;

	const markDirty = vi.fn();

	const brand: PaintBrandDefinition = {
		id: 'citadel',
		label: 'Citadel'
	};

	beforeEach(() => {
		db = new Database(':memory:');

		createSchema(db);

		paintSnapshotService = {
			markDirty
		} as unknown as PaintSnapshotService;

		repository = new PaintBrandRepository(db, paintSnapshotService);

		markDirty.mockClear();
	});

	afterEach(() => {
		db.close();
	});

	describe('findAll', () => {
		it('should return all brands ordered by label', () => {
			repository.insert({
				id: 'vallejo',
				label: 'Vallejo'
			});

			repository.insert({
				id: 'citadel',
				label: 'Citadel'
			});

			repository.insert({
				id: 'two-thin-coats',
				label: 'Two Thin Coats'
			});

			expect(repository.findAll()).toEqual([
				{
					id: 'citadel',
					label: 'Citadel'
				},
				{
					id: 'two-thin-coats',
					label: 'Two Thin Coats'
				},
				{
					id: 'vallejo',
					label: 'Vallejo'
				}
			]);
		});

		it('should return an empty array when no brands exist', () => {
			expect(repository.findAll()).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return brand by id', () => {
			repository.insert(brand);

			expect(repository.findById(brand.id)).toEqual(brand);
		});

		it('should return undefined when brand does not exist', () => {
			expect(repository.findById('missing')).toBeUndefined();
		});
	});

	describe('insert', () => {
		it('should insert a brand', () => {
			repository.insert(brand);

			expect(repository.findById(brand.id)).toEqual(brand);
		});

		it('should mark snapshot dirty after insert', () => {
			repository.insert(brand);

			expect(markDirty).toHaveBeenCalledTimes(1);
		});

		it('should not mark snapshot dirty when insert fails', () => {
			repository.insert(brand);

			markDirty.mockClear();

			expect(() => repository.insert(brand)).toThrow();

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update the brand label', () => {
			repository.insert(brand);

			markDirty.mockClear();

			const updated: PaintBrandDefinition = {
				...brand,
				label: 'Citadel Colour'
			};

			repository.update(updated);

			expect(repository.findById(brand.id)).toEqual(updated);
		});

		it('should mark snapshot dirty after update', () => {
			repository.insert(brand);

			markDirty.mockClear();

			repository.update({
				...brand,
				label: 'Citadel Colour'
			});

			expect(markDirty).toHaveBeenCalledTimes(1);
		});

		it('should throw when brand does not exist', () => {
			const missingBrand: PaintBrandDefinition = {
				id: 'missing',
				label: 'Missing'
			};

			expect(() => repository.update(missingBrand)).toThrow('Paint brand not found: missing');

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete a brand', () => {
			repository.insert(brand);

			markDirty.mockClear();

			repository.delete(brand.id);

			expect(repository.findById(brand.id)).toBeUndefined();
		});

		it('should mark snapshot dirty after delete', () => {
			repository.insert(brand);

			markDirty.mockClear();

			repository.delete(brand.id);

			expect(markDirty).toHaveBeenCalledTimes(1);
		});

		it('should throw when brand does not exist', () => {
			expect(() => repository.delete('missing')).toThrow('Paint brand not found: missing');

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('deleteAll', () => {
		it('should delete all brands', () => {
			repository.insert({
				id: 'citadel',
				label: 'Citadel'
			});

			repository.insert({
				id: 'vallejo',
				label: 'Vallejo'
			});

			markDirty.mockClear();

			repository.deleteAll();

			expect(repository.findAll()).toEqual([]);
		});

		it('should mark snapshot dirty', () => {
			repository.deleteAll();

			expect(markDirty).toHaveBeenCalledTimes(1);
		});
	});
});

function createSchema(db: Db): void {
	db.exec(`
		CREATE TABLE paint_brand (
			id TEXT PRIMARY KEY NOT NULL,
			label TEXT NOT NULL
		);
	`);
}
