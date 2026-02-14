/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

CREATE TABLE IF NOT EXISTS manufacturers
(
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decoder_families
(
  id              TEXT PRIMARY KEY,
  manufacturer_id TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS decoders
(
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES decoder_families (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_decoder_families_manufacturer_name
  ON decoder_families (manufacturer_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS ux_decoders_family_name
  ON decoders (family_id, name);
