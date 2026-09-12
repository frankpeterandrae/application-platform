/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { InjectionToken } from '@angular/core';

export interface StarMapWorkspace {
	load(): Promise<string>;
	save(content: string): Promise<void>;
}

export const STAR_MAP_WORKSPACE = new InjectionToken<StarMapWorkspace>('STAR_MAP_WORKSPACE');
