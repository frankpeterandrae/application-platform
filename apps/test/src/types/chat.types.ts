/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export interface Option {
	value: string;
	next: string;
}
export interface BaseNode {
	id?: string;
	type: string;
	text?: string;
}
export interface QuestionNode extends BaseNode {
	type: 'question';
	text: string;
	options: Option[];
}
export interface TextNode extends BaseNode {
	type: 'text';
	text: string;
	next?: string;
}
export interface ResultNode extends BaseNode {
	type: 'result';
	text: string;
	resultButtonId: string;
}
export type DialogNode = QuestionNode | TextNode | ResultNode | BaseNode;
export type NodeSource = Record<string, DialogNode> | ((id: string) => DialogNode | undefined | Promise<DialogNode | undefined>);
export interface ChatMessage {
	id: number;
	role: 'assistant' | 'user';
	text: string;
	nodeId?: string;
	partial?: boolean;
}
export interface ChatOptions {
	startNode: string;
	/** Characters per second; 0 = immediate. */
	charactersPerSecond: number;
	/** Delay before auto-following a text node, in milliseconds. */
	nextDelayMs: number;
	respectReducedMotion: boolean;
	/** Abort the animation and reveal current text when the panel closes. */
	finishOnHide: boolean;
}
export interface ChatContext {
	signal: AbortSignal;
	appendAssistant(text: string, nodeId?: string): Promise<void>;
	showChoices(choices: Option[]): Promise<string>;
	showAction(buttonId: string): void;
	goTo(id: string): void;
}
export type NodeHandler = (node: DialogNode, context: ChatContext) => Promise<string | void> | string | void;
