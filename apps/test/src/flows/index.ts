/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { FlowDefinition, FlowLoader } from './flow.types.js';
/** Explicit allowlist so the HTML attribute cannot construct arbitrary import paths. */
const registry: Record<string, FlowLoader> = {
	demo: async (): Promise<FlowDefinition> => {
		const { getFlow } = await import('./demo.flow.js');
		return { startNode: 'entry_node_welcome', nodes: getFlow() };
	},
	short: async (): Promise<FlowDefinition> => {
		const { getFlow } = await import('./short.flow.js');
		return { startNode: 'welcome', nodes: getFlow() };
	}
};
export async function loadFlow(name: string): Promise<FlowDefinition> {
	const loader = Object.hasOwn(registry, name) ? registry[name] : undefined;
	if (!loader) throw new Error(`Unknown flow: ${name}`);
	return loader();
}
