/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db } from '@application-platform/data-db';
import { PaintBrandDefinition } from '@application-platform/paint';

import { PaintSnapshotService } from '../service/paint-snapshot.service';

interface PaintBrandRow {
	id: string;
	label: string;
}

/**
 * Provides persistence operations for paint brands.
 */
export class PaintBrandRepository {
	constructor(
		private readonly db: Db,
		private readonly paintSnapshotService: PaintSnapshotService
	) {}

	/**
	 * Retrieves all paint brand definitions from the database.
	 *
	 * @returns An array of PaintBrandDefinition objects.
	 */
	public findAll(): PaintBrandDefinition[] {
		const rows = this.db
			.prepare(
				`
        SELECT
          id,
          label
        FROM paint_brand
        ORDER BY label
      `
			)
			.all() as PaintBrandRow[];

		return rows;
	}

	/**
	 * Finds a paint brand by its ID.
	 *
	 * @param id The ID of the paint brand to find.
	 * @returns The paint brand definition if found, otherwise undefined.
	 */
	public findById(id: string): PaintBrandDefinition | undefined {
		return this.db
			.prepare(
				`
        SELECT
          id,
          label
        FROM paint_brand
        WHERE id = ?
      `
			)
			.get(id) as PaintBrandDefinition | undefined;
	}

	/**
	 * Inserts a new paint brand into the database.
	 *
	 * @param brand The paint brand definition to insert.
	 */
	public insert(brand: PaintBrandDefinition): void {
		this.db
			.prepare(
				`
      INSERT INTO paint_brand (
        id,
        label
      )
      VALUES (?, ?)
    `
			)
			.run(brand.id, brand.label);
		this.paintSnapshotService.markDirty();
	}

	/**
	 * Updates an existing paint brand.
	 * The brand ID remains unchanged.
	 *
	 * @param brand The brand data to update.
	 */
	public update(brand: PaintBrandDefinition): void {
		const result = this.db
			.prepare(
				`
        UPDATE paint_brand
        SET label = ?
        WHERE id = ?
      `
			)
			.run(brand.label, brand.id);

		if (result.changes === 0) {
			throw new Error(`Paint brand not found: ${brand.id}`);
		}

		this.paintSnapshotService.markDirty();
	}

	/**
	 * Deletes a paint brand by its ID.
	 *
	 * @param id The ID of the brand to delete.
	 */
	public delete(id: string): void {
		const result = this.db
			.prepare(
				`
        DELETE FROM paint_brand
        WHERE id = ?
      `
			)
			.run(id);

		if (result.changes === 0) {
			throw new Error(`Paint brand not found: ${id}`);
		}

		this.paintSnapshotService.markDirty();
	}

	/**
	 * Deletes all paint brands from the database.
	 */
	public deleteAll(): void {
		this.db.prepare('DELETE FROM paint_brand').run();
		this.paintSnapshotService.markDirty();
	}
}
