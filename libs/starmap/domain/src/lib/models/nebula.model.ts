/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Position3d } from './position.model';

export type NebulaType = 'cloud' | 'outline' | 'haze';

export interface NebulaNode {
	id: string;
	position: Position3d;
	radius: number;
}

export interface NebulaConnection {
	from: string;
	to: string;
}

export interface Nebula {
	id: string;
	name: string;
	style: NebulaType;
	color: `#${string}`;
	opacity: number;
	nodes: NebulaNode[];
	connections: NebulaConnection[];
}
