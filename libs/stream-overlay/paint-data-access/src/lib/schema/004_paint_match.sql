/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
CREATE TABLE paint_match (
	paint_id TEXT NOT NULL REFERENCES paint (id) ON DELETE CASCADE,
	match_paint_id TEXT NOT NULL REFERENCES paint (id) ON DELETE CASCADE,
	PRIMARY KEY (paint_id, match_paint_id),
	CHECK (paint_id <> match_paint_id)
);

CREATE INDEX paint_match_target ON paint_match (match_paint_id);
