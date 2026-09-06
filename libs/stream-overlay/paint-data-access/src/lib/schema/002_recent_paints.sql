/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
CREATE TABLE IF NOT EXISTS paint_recent_selection (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	paint_id TEXT NOT NULL UNIQUE,
	FOREIGN KEY (paint_id) REFERENCES paint (id) ON DELETE CASCADE
);
