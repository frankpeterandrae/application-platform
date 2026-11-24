/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
CREATE TABLE paint_match_names (
	paint_id TEXT NOT NULL REFERENCES paint (id) ON DELETE CASCADE,
	name TEXT NOT NULL CHECK (length (trim(name)) > 0),
	PRIMARY KEY (paint_id, name)
);

INSERT INTO
	paint_match_names (paint_id, name)
SELECT DISTINCT
	paint_match.paint_id,
	trim(target.name) || ' (' || target.brand_id || ')'
FROM
	paint_match
	JOIN paint AS target ON target.id = paint_match.match_paint_id;

DROP TABLE paint_match;

ALTER TABLE paint_match_names
RENAME TO paint_match;
