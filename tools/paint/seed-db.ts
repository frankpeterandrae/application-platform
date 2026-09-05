/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import path from 'node:path';

import { openDb } from '../../libs/shared/data-db/src';

const db = openDb(path.join(process.cwd(), 'data', 'stream-overlay.db'));

try {
	const insertBrand = db.prepare(`
    INSERT OR IGNORE INTO paint_brand (
      id,
      label
    )
    VALUES (?, ?)
  `);

	const insertPaint = db.prepare(`
    INSERT OR IGNORE INTO paint (
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
  `);

	insertBrand.run('citadel', 'Citadel');

	insertBrand.run('two-thin-coats', 'Two Thin Coats');

	insertPaint.run('citadel:21-03', 'citadel', '21-03', 'Mephiston Red', 'Citadel Colour', 'base', '#991115', null, null);

	insertPaint.run(
		'two-thin-coats:10002',
		'two-thin-coats',
		'10002',
		'Sanguine Scarlet',
		'Two Thin Coats',
		'mid',
		'#991915',
		null,
		'5060951920012'
	);
} finally {
	db.close();
}
