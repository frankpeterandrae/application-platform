/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist/styles', { recursive: true });
cpSync('src/styles', 'dist/styles', { recursive: true });
