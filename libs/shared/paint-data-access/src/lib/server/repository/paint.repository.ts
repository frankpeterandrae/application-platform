/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db, withTx } from '@application-platform/data-db';
import { HexColor, Paint, PaintColorGroup, PaintId } from '@application-platform/paint';

import { PaintSnapshotService } from '../service/paint-snapshot.service';

interface PaintRow {
	id: PaintId;
	brand_id: string;
	sku: string;
	name: string;
	range: string | null;
	category: string | null;
	color_groups: string;
	main_color: HexColor;
	secondary_color: HexColor | null;
	barcode: string | null;
}

/**
 * Provides persistence operations for paint data.
 */
export class PaintRepository {
	constructor(
		private readonly db: Db,
		private readonly paintSnapshotService: PaintSnapshotService
	) {}

	/**
	 * Retrieves all paint records from the database.
	 *
	 * @returns An array of Paint objects.
	 */
	public findAll(): Paint[] {
		const rows = this.db
			.prepare(
				`
        SELECT
          id,
          brand_id,
          sku,
          name,
          range,
          category,
		  COALESCE(
			  (
				  SELECT json_group_array(color_group)
				  FROM paint_color_group
				  WHERE paint_id = paint.id
			  ),
			  '[]'
		  ) AS color_groups,
          main_color,
          secondary_color,
          barcode
        FROM paint
        ORDER BY name
      `
			)
			.all() as PaintRow[];

		return rows.map((row) => this.mapRow(row));
	}

	/**
	 * Finds a paint by its ID.
	 *
	 * @param id The ID of the paint to find.
	 * @returns The paint if found, otherwise undefined.
	 */
	public findById(id: PaintId): Paint | undefined {
		const row = this.db
			.prepare(
				`
        SELECT
          id,
          brand_id,
          sku,
          name,
          range,
          category,
		  COALESCE(
			  (
				  SELECT json_group_array(color_group)
				  FROM paint_color_group
				  WHERE paint_id = paint.id
			  ),
			  '[]'
		  ) AS color_groups,
          main_color,
          secondary_color,
          barcode
        FROM paint
        WHERE id = ?
      `
			)
			.get(id) as PaintRow | undefined;

		return row ? this.mapRow(row) : undefined;
	}

	/**
	 * Finds all paints associated with a specific brand.
	 *
	 * @param brand The brand ID to filter paints by.
	 * @returns An array of Paint objects associated with the specified brand.
	 */
	public findByBrand(brand: string): Paint[] {
		const rows = this.db
			.prepare(
				`
        SELECT
          id,
          brand_id,
          sku,
          name,
          range,
          category,
          COALESCE(
			  (
				  SELECT json_group_array(color_group)
				  FROM paint_color_group
				  WHERE paint_id = paint.id
			  ),
			  '[]'
				   ) AS color_groups,
          main_color,
          secondary_color,
          barcode
        FROM paint
        WHERE brand_id = ?
        ORDER BY name
      `
			)
			.all(brand) as PaintRow[];

		return rows.map((row) => this.mapRow(row));
	}

	private mapRow(row: PaintRow): Paint {
		return {
			id: row.id,
			brand: row.brand_id,
			sku: row.sku,
			name: row.name,
			...(row.range !== null && {
				range: row.range
			}),
			...(row.category !== null && {
				category: row.category
			}),
			colorGroups: JSON.parse(row.color_groups) as PaintColorGroup[],
			mainColor: row.main_color,
			...(row.secondary_color !== null && {
				secondaryColor: row.secondary_color
			}),
			...(row.barcode !== null && {
				barcode: row.barcode
			})
		};
	}

	/**
	 * Inserts a new paint record into the database.
	 *
	 * @param paint The paint object to insert.
	 */
	public insert(paint: Paint): void {
		withTx(this.db, () => {
			this.db
				.prepare(
					`
				INSERT INTO paint (
					id,
					brand_id,
					sku,
					name,
					range,
					category,
					main_color,
					secondary_color,
					barcode
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`
				)
				.run(
					paint.id,
					paint.brand,
					paint.sku,
					paint.name,
					paint.range ?? null,
					paint.category ?? null,
					paint.mainColor,
					paint.secondaryColor ?? null,
					paint.barcode ?? null
				);

			this.replaceColorGroups(paint.id, paint.colorGroups);
		});

		this.paintSnapshotService.markDirty();
	}

	/**
	 * Updates the mutable data of an existing paint.
	 *
	 * The paint ID is used to locate the record; brand and SKU are not modified.
	 *
	 * @param paint The paint data to update.
	 */
	public update(paint: Paint): void {
		withTx(this.db, () => {
			const result = this.db
				.prepare(
					`
				UPDATE paint
				SET
					name = ?,
					range = ?,
					category = ?,
					main_color = ?,
					secondary_color = ?,
					barcode = ?
				WHERE id = ?
			`
				)
				.run(
					paint.name,
					paint.range ?? null,
					paint.category ?? null,
					paint.mainColor,
					paint.secondaryColor ?? null,
					paint.barcode ?? null,
					paint.id
				);

			if (result.changes === 0) {
				throw new Error(`Paint not found: ${paint.id}`);
			}

			this.replaceColorGroups(paint.id, paint.colorGroups);
		});

		this.paintSnapshotService.markDirty();
	}

	/**
	 * Deletes a paint record by its ID.
	 *
	 * @param id The ID of the paint to delete.
	 */
	public delete(id: PaintId): void {
		const result = this.db
			.prepare(
				`
        DELETE FROM paint
        WHERE id = ?
      `
			)
			.run(id);

		if (result.changes === 0) {
			throw new Error(`Paint not found: ${id}`);
		}

		this.paintSnapshotService.markDirty();
	}

	/**
	 * Deletes all paint records from the database.
	 */
	public deleteAll(): void {
		this.db.prepare('DELETE FROM paint').run();
		this.paintSnapshotService.markDirty();
	}

	/**
	 * Replaces all color-group assignments of a paint.
	 *
	 * @param paintId The paint whose assignments should be replaced.
	 * @param colorGroups The new color-group assignments.
	 */
	private replaceColorGroups(paintId: PaintId, colorGroups: readonly PaintColorGroup[]): void {
		this.db
			.prepare(
				`
			DELETE FROM paint_color_group
			WHERE paint_id = ?
		`
			)
			.run(paintId);

		const insert = this.db.prepare(`
		INSERT INTO paint_color_group (
			paint_id,
			color_group
		)
		VALUES (?, ?)
	`);

		for (const colorGroup of colorGroups) {
			insert.run(paintId, colorGroup);
		}
	}
}
