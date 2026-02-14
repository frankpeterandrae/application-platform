/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvDefinitionRow } from '../repos/programming/cv-definitions.repo';

import type { CvDefinitionOverrideRow } from './cv-definition-overrides';
import type { CvDefinitionTreeNode } from './cv-definition-tree';
import { parseCvBooleanConfig, parseCvNumberConfig, parseCvSelectConfig, parseFolderConfig } from './cv-definition-types';
import type { EffectiveCvDefinitionFlatNode } from './effective-cv-definition-flat';
import { deepMerge } from './object-merge';

/** Validates config payload against the expected schema for the given definition type. */
export function validateConfigForType(type: CvDefinitionTreeNode['type'], value: unknown): void {
	switch (type) {
		case 'folder':
			parseFolderConfig(value);
			return;
		case 'cv_number':
			parseCvNumberConfig(value);
			return;
		case 'cv_boolean':
			parseCvBooleanConfig(value);
			return;
		case 'cv_select':
			parseCvSelectConfig(value);
			return;
		default: {
			throw new Error(`Unbekannter CV-Definition-Typ: ${type}`);
		}
	}
}

/** Indexes rows by id and rejects duplicate ids. */
export function indexRowsById(rows: CvDefinitionRow[]): Map<string, CvDefinitionRow> {
	const map = new Map<string, CvDefinitionRow>();

	for (const row of rows) {
		if (map.has(row.id)) {
			throw new Error(`Doppelte CV-Definition-ID in Basisdaten: "${row.id}".`);
		}

		map.set(row.id, row);
	}

	return map;
}

/** Validates override rows against ownership, base references, and patch payload shape. */
export function validateOverrideRows(familyRows: CvDefinitionRow[], decoderId: string, overrideRows: CvDefinitionOverrideRow[]): void {
	const familyById = indexRowsById(familyRows);

	for (const override of overrideRows) {
		if (override.decoder_id !== decoderId) {
			throw new Error(`Override "${override.id}" gehört zu Decoder "${override.decoder_id}", erwartet war "${decoderId}".`);
		}

		const baseRow = familyById.get(override.base_definition_id);

		if (!baseRow) {
			throw new Error(
				`Override "${override.id}" verweist auf Base-Definition "${override.base_definition_id}", die nicht zur Decoder-Familie gehört.`
			);
		}

		let patch: unknown;

		try {
			patch = JSON.parse(override.patch_json);
		} catch {
			throw new Error(`Override "${override.id}" enthält ungültiges JSON in patch_json.`);
		}

		validateOverridePatchForBaseRow(baseRow, patch);
	}
}

/** Validates an override patch against allowed fields and base definition constraints. */
function validateOverridePatchForBaseRow(baseRow: CvDefinitionRow, patch: unknown): void {
	if (!isPlainObject(patch)) {
		throw new Error(`Override-Patch für Base-Definition "${baseRow.id}" muss ein Objekt sein.`);
	}

	const allowedKeys = new Set(['name', 'description', 'sortOrder', 'config']);

	for (const key of Object.keys(patch)) {
		if (!allowedKeys.has(key)) {
			throw new Error(`Override-Patch für Base-Definition "${baseRow.id}" enthält nicht erlaubtes Feld "${key}".`);
		}
	}

	if ('name' in patch && patch['name'] !== undefined && typeof patch['name'] !== 'string') {
		throw new Error(`Override-Patch "${baseRow.id}": name muss ein String sein.`);
	}

	if (
		'description' in patch &&
		patch['description'] !== undefined &&
		patch['description'] !== null &&
		typeof patch['description'] !== 'string'
	) {
		throw new Error(`Override-Patch "${baseRow.id}": description muss String oder null sein.`);
	}

	if ('sortOrder' in patch && patch['sortOrder'] !== undefined && typeof patch['sortOrder'] !== 'number') {
		throw new Error(`Override-Patch "${baseRow.id}": sortOrder muss eine Zahl sein.`);
	}

	if ('config' in patch && patch['config'] !== undefined) {
		const mergedConfig = deepMerge(parseJsonConfig(baseRow), patch['config']);
		validateConfigForType(baseRow.type, mergedConfig);
	}
}

/** Parses the config JSON string of a definition row. */
function parseJsonConfig(row: CvDefinitionRow): unknown {
	try {
		return JSON.parse(row.config_json);
	} catch {
		throw new Error(`CV-Definition "${row.id}" enthält ungültiges JSON in config_json.`);
	}
}

/** Validates decoder-owned definition rows and their config payloads. */
export function validateDecoderRows(decoderRows: CvDefinitionRow[], decoderId: string): void {
	for (const row of decoderRows) {
		if (row.owner_type !== 'decoder') {
			throw new Error(`CV-Definition "${row.id}" ist keine Decoder-Definition, owner_type="${row.owner_type}".`);
		}

		if (row.owner_id !== decoderId) {
			throw new Error(`CV-Definition "${row.id}" gehört zu Decoder "${row.owner_id}", erwartet war "${decoderId}".`);
		}

		validateConfigForType(row.type, parseJsonConfig(row));
	}
}

/** Validates merged effective flat nodes for uniqueness, parent integrity, and cycles. */
export function validateEffectiveFlatNodes(nodes: EffectiveCvDefinitionFlatNode[]): void {
	const idSet = new Set<string>();
	const keySet = new Set<string>();
	const nodeById = new Map<string, EffectiveCvDefinitionFlatNode>();

	for (const node of nodes) {
		if (idSet.has(node.id)) {
			throw new Error(`Doppelte effektive CV-Definition-ID: "${node.id}".`);
		}
		idSet.add(node.id);
		nodeById.set(node.id, node);

		if (keySet.has(node.key)) {
			throw new Error(`Doppelter effektiver CV-Definition-Key: "${node.key}".`);
		}
		keySet.add(node.key);

		validateConfigForType(node.type, node.config);
	}

	for (const node of nodes) {
		if (!node.parentId) {
			continue;
		}

		const parent = nodeById.get(node.parentId);

		if (!parent) {
			throw new Error(`Effektive CV-Definition "${node.id}" verweist auf unbekannten Parent "${node.parentId}".`);
		}

		if (parent.type !== 'folder') {
			throw new Error(`Effektive CV-Definition "${node.id}" hat Parent "${parent.id}", aber Parent ist kein folder.`);
		}
	}

	validateNoCycles(nodes);
}

/** Validates that the effective node set does not contain parent cycles. */
function validateNoCycles(nodes: EffectiveCvDefinitionFlatNode[]): void {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));

	const visiting = new Set<string>();
	const visited = new Set<string>();

	for (const node of nodes) {
		visit(node.id, nodeById, visiting, visited);
	}
}

/** DFS visit helper for cycle detection. */
function visit(nodeId: string, nodeById: Map<string, EffectiveCvDefinitionFlatNode>, visiting: Set<string>, visited: Set<string>): void {
	if (visited.has(nodeId)) {
		return;
	}

	if (visiting.has(nodeId)) {
		throw new Error(`Zyklus in CV-Definitionen erkannt bei "${nodeId}".`);
	}

	visiting.add(nodeId);

	const node = nodeById.get(nodeId);
	if (!node) {
		throw new Error(`Unbekannte Node "${nodeId}" während Zyklusprüfung.`);
	}

	if (node.parentId) {
		visit(node.parentId, nodeById, visiting, visited);
	}

	visiting.delete(nodeId);
	visited.add(nodeId);
}

/** Returns true when value is a plain object (and not an array). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
