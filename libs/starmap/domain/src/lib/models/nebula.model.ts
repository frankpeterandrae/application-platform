/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Position3d } from './position.model';

export type NebulaType = 'cloud' | 'outline' | 'haze';

export interface Nebula {
	id: string;
	name: string;
	style: NebulaType;
	color: `#${string}`;
	opacity: number;
	points: Position3d[];
}
