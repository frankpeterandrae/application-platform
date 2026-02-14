/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionTreeNode } from './cv-definition-tree';

export type EffectiveCvDefinitionFlatNode = {
	id: string;
	ownerType: 'family' | 'decoder';
	ownerId: string;
	parentId: string | null;
	sortOrder: number;
	key: string;
	type: CvDefinitionTreeNode['type'];
	name: string;
	description: string | null;
	config: CvDefinitionTreeNode['config'];
	createdAt: string;
	updatedAt: string;
};
