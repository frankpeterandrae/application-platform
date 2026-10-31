/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { safeFragment } from '../content.js';
export class ChatMessageElement extends HTMLElement {
	#visual: HTMLSpanElement;
	#accessible: HTMLSpanElement;
	public constructor() {
		super();
		const root = this.attachShadow({ mode: 'open' });
		this.#visual = document.createElement('span');
		this.#visual.setAttribute('aria-hidden', 'true');
		this.#accessible = document.createElement('span');
		this.#accessible.className = 'sr-only';
		const style = document.createElement('link');
		style.rel = 'stylesheet';
		style.href = new URL('../styles/chat-message.css', import.meta.url).href;
		root.append(style);
		root.append(this.#visual, this.#accessible);
	}
	public setVisualText(value: string): void {
		this.#visual.textContent = value;
	}
	public setAccessibleText(value: string): void {
		this.#accessible.textContent = value;
	}
	public complete(raw: string): void {
		this.#visual.replaceChildren(safeFragment(raw));
	}
}
if (!customElements.get('chat-message')) customElements.define('chat-message', ChatMessageElement);
