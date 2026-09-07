/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { JumpLink } from './jump-link.model';
import { Nebula } from './nebula.model';
import { StarSystem } from './star-system.model';

export interface StarMap {
	id: string;
	name: string;
	systems: StarSystem[];
	jumpLinks: JumpLink[];
	nebulae: Nebula[];
}
