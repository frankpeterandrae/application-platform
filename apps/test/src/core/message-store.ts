/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error' | 'cancelled';
export interface Message {
	id: number;
	role: 'assistant' | 'user';
	text: string;
	status: MessageStatus;
	nodeId?: string;
}
export class MessageStore extends EventTarget {
	#items: Message[] = [];
	#id = 0;
	public get messages(): readonly Message[] {
		return this.#items.map((message) => ({ ...message }));
	}
	public add(role: Message['role'], text: string, nodeId?: string): Message {
		const message: Message = { id: ++this.#id, role, text, status: role === 'user' ? 'complete' : 'pending', nodeId };
		this.#items.push(message);
		this.dispatchEvent(new CustomEvent('change', { detail: { type: 'add', message: { ...message } } }));
		return { ...message };
	}
	public update(id: number, patch: Partial<Pick<Message, 'text' | 'status'>>): void {
		const message = this.#items.find((item) => item.id === id);
		if (!message) throw new Error(`Unknown message ${id}`);
		Object.assign(message, patch);
		this.dispatchEvent(new CustomEvent('change', { detail: { type: 'update', message: { ...message } } }));
	}
	public clear(): void {
		this.#items = [];
		this.#id = 0;
		this.dispatchEvent(new Event('clear'));
	}
}
