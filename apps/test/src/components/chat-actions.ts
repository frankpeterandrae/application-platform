/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Option } from '../types/chat.types.js';
export class ChatActionsElement extends HTMLElement {
	public groupLabel = 'chat.choose';
	public constructor() {
		super();
		const root = this.attachShadow({ mode: 'open' });
		const style = document.createElement('link');
		style.rel = 'stylesheet';
		style.href = new URL('../styles/chat-actions.css', import.meta.url).href;
		root.append(style);
	}
	public setChoices(choices: Option[]): void {
		const root = this.shadowRoot!;
		const group = document.createElement('div');
		group.setAttribute('role', 'group');
		group.setAttribute('aria-label', this.groupLabel);
		for (const choice of choices) {
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = choice.value;
			button.addEventListener('click', () =>
				this.dispatchEvent(new CustomEvent('choice', { detail: { ...choice }, bubbles: true, composed: true }))
			);
			group.append(button);
		}
		root.replaceChildren(root.querySelector('link')!, group);
	}
	public disable(): void {
		this.shadowRoot?.querySelectorAll('button').forEach((button) => {
			button.disabled = true;
		});
	}
}
if (!customElements.get('chat-actions')) customElements.define('chat-actions', ChatActionsElement);
