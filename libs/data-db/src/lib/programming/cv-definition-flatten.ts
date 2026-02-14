/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionTreeNode } from './cv-definition-tree';
import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';

/** Flattens a CV definition tree into a preorder list of nodes. */
export function flattenCvDefinitionTree(nodes: CvDefinitionTreeNode[]): EffectiveCvDefinitionFlatNode[] {
	const result: EffectiveCvDefinitionFlatNode[] = [];

	for (const node of nodes) {
		flattenNode(node, result);
	}

	return result;
}

/** Appends one node and all descendants to the result list. */
function flattenNode(node: CvDefinitionTreeNode, result: EffectiveCvDefinitionFlatNode[]): void {
	result.push({
		id: node.id,
		ownerType: node.ownerType,
		ownerId: node.ownerId,
		parentId: node.parentId,
		sortOrder: node.sortOrder,
		key: node.key,
		type: node.type,
		name: node.name,
		description: node.description,
		config: node.config,
		createdAt: node.createdAt,
		updatedAt: node.updatedAt
	});

	for (const child of node.children) {
		flattenNode(child, result);
	}
}
