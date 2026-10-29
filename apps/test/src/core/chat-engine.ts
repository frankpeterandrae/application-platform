/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { DialogNode, NodeHandler, NodeSource } from '../types/chat.types.js';
/** Framework-free orchestration primitives. UI-specific behavior belongs to adapters/runner. */
export class ChatEngine {
	#source?: NodeSource;
	#handlers = new Map<string, NodeHandler>();
	public constructor(source?: NodeSource) {
		this.#source = source;
	}
	public set source(source: NodeSource | undefined) {
		this.#source = source;
	}
	public async lookup(id: string): Promise<DialogNode> {
		const source = this.#source;
		const node = typeof source === 'function' ? await source(id) : source?.[id];
		if (!node || !node.type) throw new Error(`Dialogknoten fehlt: ${id}`);
		return node;
	}
	public register(type: string, handler: NodeHandler): () => void {
		if (['question', 'text', 'result'].includes(type)) throw new Error('Built-in type is reserved');
		this.#handlers.set(type, handler);
		return () => {
			if (this.#handlers.get(type) === handler) this.#handlers.delete(type);
		};
	}
	public handler(type: string): NodeHandler | undefined {
		return this.#handlers.get(type);
	}
}
