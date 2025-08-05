/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Signal } from '@angular/core';

export interface MenuItem {
	id: string;
	label: string | Signal<string>;
	icon?: string;
	route?: string;
	children?: MenuItem[];
}
