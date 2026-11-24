/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { DatabaseSnapshotConfig } from '@application-platform/data-db';

/**
 * Snapshot configuration for paint data.
 */
export const paintSnapshotConfig: DatabaseSnapshotConfig = {
	tablePrefix: 'paint',
	tables: {
		paint: {
			groupBy: 'brand_id',
			orderBy: ['brand_id', 'sku']
		},

		paint_brand: {
			orderBy: ['id']
		},

		paint_color_group: {
			orderBy: ['paint_id', 'color_group']
		},
		paint_match: {
			orderBy: ['paint_id', 'name'],
			clearWhenMissingIfImporting: 'paint'
		},
		paint_recent_selection: {
			export: false,
			import: false
		}
	}
};
