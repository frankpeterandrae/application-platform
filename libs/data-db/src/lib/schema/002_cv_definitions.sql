/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
CREATE TABLE IF NOT EXISTS cv_definitions (
  id TEXT PRIMARY KEY,

  owner_type TEXT NOT NULL,           -- 'family' | 'decoder'
  owner_id TEXT NOT NULL,

  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,

  key TEXT NOT NULL,
  type TEXT NOT NULL,                 -- 'folder' | 'cv_boolean' | 'cv_number'

  name TEXT NOT NULL,
  description TEXT,

  config_json TEXT NOT NULL,              -- JSON string with type-specific configuration
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (parent_id) REFERENCES cv_definitions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cv_definitions_owner ON cv_definitions (owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_cv_definitions_parent ON cv_definitions (parent_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cv_definitions_owner_key ON cv_definitions (owner_type, owner_id, key);

