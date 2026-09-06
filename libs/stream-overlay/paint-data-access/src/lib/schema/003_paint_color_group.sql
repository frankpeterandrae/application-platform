/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
CREATE TABLE paint_color_group (
	paint_id TEXT NOT NULL,
	color_group TEXT NOT NULL,
	PRIMARY KEY (paint_id, color_group),
	FOREIGN KEY (paint_id) REFERENCES paint (id) ON DELETE CASCADE
);
