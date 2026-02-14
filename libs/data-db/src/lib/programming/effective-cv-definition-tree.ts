/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '../db';
import { listCvDefinitionOverridesByDecoder } from '../repos/programming/cv-definition-overrides.repo';
import { listCvDefinitionsByOwner } from '../repos/programming/cv-definitions.repo';

import { flattenCvDefinitionTree } from './cv-definition-flatten';
import { buildCvDefinitionTree, type CvDefinitionTreeNode } from './cv-definition-tree';
import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';
import { buildEffectiveCvDefinitionTree } from './effective-cv-definition-tree-builder';
import { validateDecoderRows, validateEffectiveFlatNodes, validateOverrideRows } from './effective-cv-definition-validation';
import { deepMerge } from './object-merge';

/** Builds the effective CV definition tree for a decoder by merging family definitions with decoder-specific overrides and additions. */
export function getEffectiveCvDefinitionTreeForDecoder(db: Db, familyId: string, decoderId: string): CvDefinitionTreeNode[] {
	const familyRows = listCvDefinitionsByOwner(db, 'family', familyId);
	const decoderRows = listCvDefinitionsByOwner(db, 'decoder', decoderId);
	const overrideRows = listCvDefinitionOverridesByDecoder(db, decoderId);

	validateDecoderRows(decoderRows, decoderId);
	validateOverrideRows(familyRows, decoderId, overrideRows);

	const familyTree = buildCvDefinitionTree(familyRows);
	const familyNodes = cloneTree(familyTree);

	const overrideByBaseId = new Map(overrideRows.map((row) => [row.base_definition_id, row]));

	const patchedFamilyTree = applyOverridesToTree(familyNodes, overrideByBaseId);
	const effectiveFlatNodes = flattenCvDefinitionTree(patchedFamilyTree);

	const decoderFlatNodes = decoderRows.map(mapDecoderRowToEffectiveFlatNode);

	const mergedFlatNodes = [...effectiveFlatNodes, ...decoderFlatNodes];

	validateEffectiveFlatNodes(mergedFlatNodes);

	return buildEffectiveCvDefinitionTree(mergedFlatNodes);
}

/** Returns a deep clone of each node in the array. */
function cloneTree(nodes: CvDefinitionTreeNode[]): CvDefinitionTreeNode[] {
	return nodes.map(cloneNode);
}

/** Returns a deep clone of a single tree node, recursively cloning its children. */
function cloneNode(node: CvDefinitionTreeNode): CvDefinitionTreeNode {
	return {
		...node,
		config: deepClone(node.config),
		children: node.children.map(cloneNode)
	} as CvDefinitionTreeNode;
}

/** Creates a deep clone of a value via JSON serialisation. */
function deepClone<T>(value: T): T {
	return structuredClone(value);
}

/** Maps a decoder definition DB row into the effective flat-node shape. */
function mapDecoderRowToEffectiveFlatNode(row: {
	id: string;
	owner_type: 'family' | 'decoder';
	owner_id: string;
	parent_id: string | null;
	sort_order: number;
	key: string;
	type: CvDefinitionTreeNode['type'];
	name: string;
	description: string | null;
	config_json: string;
	created_at: string;
	updated_at: string;
}): EffectiveCvDefinitionFlatNode {
	let parsedConfig: EffectiveCvDefinitionFlatNode['config'];

	try {
		parsedConfig = JSON.parse(row.config_json) as EffectiveCvDefinitionFlatNode['config'];
	} catch {
		throw new Error(`Decoder-CV-Definition "${row.id}" enthält ungültiges JSON in config_json.`);
	}

	return {
		id: row.id,
		ownerType: row.owner_type,
		ownerId: row.owner_id,
		parentId: row.parent_id,
		sortOrder: row.sort_order,
		key: row.key,
		type: row.type,
		name: row.name,
		description: row.description,
		config: parsedConfig,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

/** Ensures each effective node id is unique and throws on duplicates. */
function ensureNoDuplicateIds(nodes: EffectiveCvDefinitionFlatNode[]): void {
	const seen = new Set<string>();

	for (const node of nodes) {
		if (seen.has(node.id)) {
			throw new Error(`Doppelte CV-Definition-ID im effektiven Baum: "${node.id}".`);
		}

		seen.add(node.id);
	}
}

type OverrideMap = Map<
	string,
	{
		id: string;
		decoder_id: string;
		base_definition_id: string;
		is_disabled: number;
		patch_json: string;
		created_at: string;
		updated_at: string;
	}
>;

/** Walks the tree, applying any override patches and removing disabled nodes. */
function applyOverridesToTree(nodes: CvDefinitionTreeNode[], overrideByBaseId: OverrideMap): CvDefinitionTreeNode[] {
	const result: CvDefinitionTreeNode[] = [];

	for (const node of nodes) {
		const patchedNode = applyOverrideToNode(node, overrideByBaseId);
		if (patchedNode) {
			result.push(patchedNode);
		}
	}

	return result;
}

/** Applies an override entry to a single node, returning null if the node is disabled. */
function applyOverrideToNode(node: CvDefinitionTreeNode, overrideByBaseId: OverrideMap): CvDefinitionTreeNode | null {
	const override = overrideByBaseId.get(node.id);

	if (override?.is_disabled) {
		return null;
	}

	let nextNode: CvDefinitionTreeNode = {
		...node,
		config: deepClone(node.config),
		children: []
	} as CvDefinitionTreeNode;

	if (override) {
		const patch = JSON.parse(override.patch_json) as {
			name?: string;
			description?: string | null;
			sortOrder?: number;
			config?: Record<string, unknown>;
		};

		nextNode = {
			...nextNode,
			name: patch.name ?? nextNode.name,
			description: patch.description === undefined ? nextNode.description : patch.description,
			sortOrder: patch.sortOrder ?? nextNode.sortOrder,
			config: patch.config ? deepMerge(nextNode.config, patch.config) : nextNode.config
		} as CvDefinitionTreeNode;
	}

	const children: CvDefinitionTreeNode[] = [];

	for (const child of node.children) {
		const patchedChild = applyOverrideToNode(child, overrideByBaseId);
		if (patchedChild) {
			children.push(patchedChild);
		}
	}

	nextNode.children = children;
	return nextNode;
}
