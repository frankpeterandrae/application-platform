/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Db, withTx } from '@application-platform/data-db';
import { PaintId } from '@application-platform/paint';

/**
 * Persists and retrieves recently selected paints.
 */
export class PaintRecentSelectionRepository {
	constructor(private readonly db: Db) {}

	/**
	 * Retrieves the list of recently selected paint IDs from the database.
	 *
	 * @param limit The maximum number of recent paint IDs to retrieve. Defaults to 8.
	 * @returns An array of recently selected PaintId values.
	 */
	public findRecent(limit = 8): PaintId[] {
		const rows = this.db
			.prepare(
				`
				SELECT paint_id
				FROM paint_recent_selection
				ORDER BY id DESC
				LIMIT ?
			`
			)
			.all(limit) as Array<{
			paint_id: PaintId;
		}>;

		return rows.map((row) => row.paint_id);
	}

	/**
	 * Selects a paint by its ID and updates the recent selection list in the database.
	 * If the paint ID already exists in the recent selection, it will be moved to the top of the list.
	 * The list is limited to the most recent 8 selections.
	 *
	 * @param paintId The ID of the paint to select.
	 */
	public select(paintId: PaintId): void {
		withTx(this.db, () => {
			this.db
				.prepare(
					`
					DELETE FROM paint_recent_selection
					WHERE paint_id = ?
				`
				)
				.run(paintId);

			this.db
				.prepare(
					`
					INSERT INTO paint_recent_selection (
						paint_id
					)
					VALUES (?)
				`
				)
				.run(paintId);

			this.db
				.prepare(
					`
					DELETE FROM paint_recent_selection
					WHERE id NOT IN (
						SELECT id
						FROM paint_recent_selection
						ORDER BY id DESC
						LIMIT 8
					)
				`
				)
				.run();
		});
	}
}
