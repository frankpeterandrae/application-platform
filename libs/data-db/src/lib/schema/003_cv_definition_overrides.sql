/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

CREATE TABLE cv_definition_overrides (
  id TEXT PRIMARY KEY,
  decoder_id TEXT NOT NULL,
  base_definition_id TEXT NOT NULL,

  is_disabled INTEGER NOT NULL DEFAULT 0,
  patch_json TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (decoder_id) REFERENCES decoders(id) ON DELETE CASCADE,
  FOREIGN KEY (base_definition_id) REFERENCES cv_definitions(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ux_cv_definition_overrides_decoder_base
  ON cv_definition_overrides(decoder_id, base_definition_id);

CREATE INDEX idx_cv_definition_overrides_decoder
  ON cv_definition_overrides(decoder_id);
