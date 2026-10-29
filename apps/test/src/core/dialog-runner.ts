/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChatEngine } from './chat-engine.js';
import type { ChatContext, Option } from '../types/chat.types.js';
export interface DialogPort {
	assistant(text: string, nodeId: string, signal: AbortSignal): Promise<void>;
	choose(options: Option[], signal: AbortSignal): Promise<string>;
	action(buttonId: string): void;
	delay(ms: number, signal: AbortSignal): Promise<void>;
}
export class DialogRunner {
	public constructor(
		private readonly engine: ChatEngine,
		private readonly port: DialogPort,
		private readonly nextDelayMs: () => number
	) {}
	public async run(start: string, signal: AbortSignal): Promise<void> {
		let next: string | undefined = start;
		const autoPath = new Set<string>();
		const advance = async (id: string): Promise<void> => {
			if (signal.aborted) return;
			if (autoPath.has(id)) throw new Error(`Zyklus ohne Nutzereingabe: ${id}`);
			autoPath.add(id);
			const node = await this.engine.lookup(id);
			if (signal.aborted) return;
			next = undefined;
			if (node.type === 'question') {
				if (!('options' in node) || !Array.isArray(node.options)) throw new Error(`Optionen fehlen: ${id}`);
				await this.port.assistant(node.text ?? '', id, signal);
				next = await this.port.choose(node.options as Option[], signal);
				autoPath.clear();
			} else if (node.type === 'text') {
				await this.port.assistant(node.text ?? '', id, signal);
				next = 'next' in node ? String(node.next ?? '') : undefined;
				if (next && this.nextDelayMs()) await this.port.delay(this.nextDelayMs(), signal);
			} else if (node.type === 'result') {
				await this.port.assistant(node.text ?? '', id, signal);
				this.port.action('resultButtonId' in node ? String(node.resultButtonId) : '');
			} else {
				const handler = this.engine.handler(node.type);
				if (!handler) throw new Error(`Unbekannter Knotentyp: ${node.type}`);
				let navigation: string | undefined;
				const context: ChatContext = {
					signal,
					appendAssistant: (text, idOverride) => this.port.assistant(text, idOverride ?? id, signal),
					showChoices: (choices) => this.port.choose(choices, signal),
					showAction: (buttonId) => this.port.action(buttonId),
					goTo: (nodeId) => {
						navigation = nodeId;
					}
				};
				const result = await handler(node, context);
				next = navigation ?? (typeof result === 'string' ? result : undefined);
			}
			if (next && !signal.aborted) await advance(next);
		};
		if (next) await advance(next);
	}
}
