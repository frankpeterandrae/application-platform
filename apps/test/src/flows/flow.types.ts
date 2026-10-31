/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { DialogNode } from '../types/chat.types.js';
/** Keep the existing getFlow(): Record<FlowId, DialogNode> contract unchanged. */
export interface FlowDefinition {
	readonly startNode: string;
	readonly nodes: Record<string, DialogNode>;
}
export type FlowLoader = () => Promise<FlowDefinition>;
