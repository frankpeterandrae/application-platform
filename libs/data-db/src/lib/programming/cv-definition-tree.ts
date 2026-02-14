/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionRow } from '../repos/programming/cv-definitions.repo';

import {
	CvDefinitionConfigByType,
	CvDefinitionType,
	CvOwnerType,
	parseCvBooleanConfig,
	parseCvNumberConfig,
	parseCvSelectConfig,
	parseFolderConfig
} from './cv-definition-types';

export type CvDefinitionTreeNodeBase = {
	id: string;
	ownerType: CvOwnerType;
	ownerId: string;
	parentId: string | null;
	sortOrder: number;
	key: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	children: CvDefinitionTreeNode[];
};

export type FolderTreeNode = CvDefinitionTreeNodeBase & {
	type: 'folder';
	config: CvDefinitionConfigByType['folder'];
};

export type CvNumberTreeNode = CvDefinitionTreeNodeBase & {
	type: 'cv_number';
	config: CvDefinitionConfigByType['cv_number'];
};

export type CvBooleanTreeNode = CvDefinitionTreeNodeBase & {
	type: 'cv_boolean';
	config: CvDefinitionConfigByType['cv_boolean'];
};

export type CvSelectTreeNode = CvDefinitionTreeNodeBase & {
	type: 'cv_select';
	config: CvDefinitionConfigByType['cv_select'];
};

export type CvDefinitionTreeNode = FolderTreeNode | CvNumberTreeNode | CvBooleanTreeNode | CvSelectTreeNode;

/** Maps a DB row to the in-memory tree node shape. */
export function mapCvDefinitionRowToNode(row: CvDefinitionRow): CvDefinitionTreeNode {
	const base = {
		id: row.id,
		ownerType: row.owner_type,
		ownerId: row.owner_id,
		parentId: row.parent_id,
		sortOrder: row.sort_order,
		key: row.key,
		name: row.name,
		description: row.description,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		children: []
	};

	switch (row.type) {
		case 'folder':
			return {
				...base,
				type: 'folder',
				config: parseConfigByType(row) as CvDefinitionConfigByType['folder']
			};
		case 'cv_number':
			return {
				...base,
				type: 'cv_number',
				config: parseConfigByType(row) as CvDefinitionConfigByType['cv_number']
			};
		case 'cv_boolean':
			return {
				...base,
				type: 'cv_boolean',
				config: parseConfigByType(row) as CvDefinitionConfigByType['cv_boolean']
			};
		case 'cv_select':
			return {
				...base,
				type: 'cv_select',
				config: parseConfigByType(row) as CvDefinitionConfigByType['cv_select']
			};
		default: {
			const exhaustiveCheck: never = row.type;
			throw new Error(`Unknown CV definition type: ${exhaustiveCheck}`);
		}
	}
}

/** Parses the raw JSON config for a CV definition row into the typed config object for its variant. */
function parseConfigByType(row: CvDefinitionRow): CvDefinitionConfigByType[CvDefinitionType] {
	const parsed = JSON.parse(row.config_json);

	switch (row.type) {
		case 'folder':
			return parseFolderConfig(parsed);
		case 'cv_number':
			return parseCvNumberConfig(parsed);
		case 'cv_boolean':
			return parseCvBooleanConfig(parsed);
		case 'cv_select':
			return parseCvSelectConfig(parsed);
		default: {
			const exhaustiveCheck: never = row.type;
			throw new Error(`Unbekannter CV-Definition-Typ: ${exhaustiveCheck}`);
		}
	}
}

/** Builds a sorted parent/child tree and validates parent references. */
export function buildCvDefinitionTree(rows: CvDefinitionRow[]): CvDefinitionTreeNode[] {
	const nodes = rows.map(mapCvDefinitionRowToNode);
	const nodeById = new Map<string, CvDefinitionTreeNode>();
	const roots: CvDefinitionTreeNode[] = [];

	for (const node of nodes) {
		nodeById.set(node.id, node);
	}

	for (const node of nodes) {
		if (!node.parentId) {
			roots.push(node);
			continue;
		}

		const parent = nodeById.get(node.parentId);

		if (!parent) {
			throw new Error(`CV-Definition node "${node.id}" references missing parent "${node.parentId}".`);
		}

		if (parent.type !== 'folder') {
			throw new Error(
				`CV-Definition node "${node.id}" references parent "${parent.id}" with type "${parent.type}", expected "folder".`
			);
		}

		parent.children.push(node);
	}

	sortTreeNodes(roots);

	return roots;
}

/** Sorts siblings recursively by sort order and then by localized name. */
function sortTreeNodes(nodes: CvDefinitionTreeNode[]): void {
	nodes.sort(compareNodes);

	for (const node of nodes) {
		if (node.children.length > 0) {
			sortTreeNodes(node.children);
		}
	}
}

/** Comparator used for deterministic ordering in tree output. */
function compareNodes(a: CvDefinitionTreeNode, b: CvDefinitionTreeNode): number {
	if (a.sortOrder !== b.sortOrder) {
		return a.sortOrder - b.sortOrder;
	}

	return a.name.localeCompare(b.name, 'de');
}
