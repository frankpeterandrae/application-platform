/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
CREATE TABLE IF NOT EXISTS paint_brand (id TEXT PRIMARY KEY, label TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS paint (
	id TEXT PRIMARY KEY,
	brand_id TEXT NOT NULL,
	sku TEXT NOT NULL,
	name TEXT NOT NULL,
	range TEXT,
	category TEXT,
	main_color TEXT NOT NULL,
	secondary_color TEXT,
	barcode TEXT,
	FOREIGN KEY (brand_id) REFERENCES paint_brand (id),
	UNIQUE (brand_id, sku)
);
