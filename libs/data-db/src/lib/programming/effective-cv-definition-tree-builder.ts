/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionTreeNode } from './cv-definition-tree';
import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';

/** Builds a validated tree structure from effective flat nodes. */
export function buildEffectiveCvDefinitionTree(flatNodes: EffectiveCvDefinitionFlatNode[]): CvDefinitionTreeNode[] {
	const nodeById = new Map<string, CvDefinitionTreeNode>();
	const roots: CvDefinitionTreeNode[] = [];

	for (const flat of flatNodes) {
		nodeById.set(flat.id, {
			id: flat.id,
			ownerType: flat.ownerType,
			ownerId: flat.ownerId,
			parentId: flat.parentId,
			sortOrder: flat.sortOrder,
			key: flat.key,
			type: flat.type,
			name: flat.name,
			description: flat.description,
			config: deepClone(flat.config),
			createdAt: flat.createdAt,
			updatedAt: flat.updatedAt,
			children: []
		} as CvDefinitionTreeNode);
	}

	for (const node of nodeById.values()) {
		if (!node.parentId) {
			roots.push(node);
			continue;
		}

		const parent = nodeById.get(node.parentId);

		if (!parent) {
			throw new Error(`Effektive CV-Definition "${node.id}" verweist auf unbekannten Parent "${node.parentId}".`);
		}

		if (parent.type !== 'folder') {
			throw new Error(`Effektive CV-Definition "${node.id}" hat Parent "${parent.id}", aber Parent ist kein folder.`);
		}

		parent.children.push(node);
	}

	sortNodesRecursive(roots);
	return roots;
}

/** Sorts tree nodes recursively by sort order and localized name. */
function sortNodesRecursive(nodes: CvDefinitionTreeNode[]): void {
	nodes.sort((a, b) => {
		if (a.sortOrder !== b.sortOrder) {
			return a.sortOrder - b.sortOrder;
		}

		return a.name.localeCompare(b.name, 'de');
	});

	for (const node of nodes) {
		if (node.children.length > 0) {
			sortNodesRecursive(node.children);
		}
	}
}

/** Creates a deep clone of a JSON-compatible value. */
function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}
