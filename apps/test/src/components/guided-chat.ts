/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChatEngine } from '../core/chat-engine.js';
import { DialogRunner, type DialogPort } from '../core/dialog-runner.js';
import { MessageStore } from '../core/message-store.js';
import { TextStream } from '../streaming/text-stream.js';
import { Announcer } from '../accessibility/announcer.js';
import { FocusManager } from '../accessibility/focus-manager.js';
import { effectiveCharactersPerSecond } from '../accessibility/motion-preferences.js';
import { plainText } from '../content.js';
import { chatText } from '../i18n/keys.js';
import { ChatMessageElement } from './chat-message.js';
import { ChatActionsElement } from './chat-actions.js';
import type { NodeSource, NodeHandler, ChatOptions, Option } from '../types/chat.types.js';

const DEFAULTS: ChatOptions = {
	startNode: 'entry_node_welcome',
	charactersPerSecond: 42,
	nextDelayMs: 250,
	respectReducedMotion: true,
	finishOnHide: true
};
export class GuidedChat extends HTMLElement {
	#config: ChatOptions = { ...DEFAULTS };
	#engine = new ChatEngine();
	#store = new MessageStore();
	#focus = new FocusManager();
	#stream?: TextStream;
	#abort?: AbortController;
	#panelObserver?: MutationObserver;
	#initialized = false;
	#translate: (key: string) => string = (key) => key;
	public set translator(fn: (key: string) => string) {
		this.#translate = fn;
		this.#refreshLabels();
	}
	#t(key: string): string {
		return this.#translate(key);
	}
	#refreshLabels(): void {
		if (!this.#initialized) return;
		this.shadowRoot?.querySelector('.chat')?.setAttribute('aria-label', this.#t(chatText.region));
		const heading = this.shadowRoot?.querySelector('.header strong');
		if (heading) heading.textContent = this.#t(chatText.heading);
		const restart = this.shadowRoot?.querySelector<HTMLButtonElement>('.restart');
		if (restart) restart.textContent = this.#t(chatText.restart);
		this.#log.setAttribute('aria-label', this.#t(chatText.log));
		this.#skip.textContent = this.#t(chatText.skip);
	}
	#log!: HTMLDivElement;
	#status!: HTMLDivElement;
	#skip!: HTMLButtonElement;
	#announcer!: Announcer;
	public constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}
	public set nodes(source: NodeSource) {
		this.#engine.source = source;
		if (this.isConnected) void this.restart();
	}
	public configure(config: Partial<ChatOptions>): void {
		this.#config = { ...this.#config, ...config };
	}
	public registerHandler(type: string, handler: NodeHandler): () => void {
		return this.#engine.register(type, handler);
	}
	public get messages() {
		return this.#store.messages;
	}
	public skip(): void {
		this.#stream?.skip();
	}
	public connectedCallback(): void {
		if (!this.#initialized) {
			const root = this.shadowRoot!;
			const style = document.createElement('link');
			style.rel = 'stylesheet';
			style.href = new URL('../styles/chat.css', import.meta.url).href;
			const shell = document.createElement('section');
			shell.className = 'chat';
			shell.setAttribute('aria-label', this.#t(chatText.region));
			const header = document.createElement('header');
			header.className = 'header';
			const heading = document.createElement('strong');
			heading.textContent = this.#t(chatText.heading);
			const restart = this.#button(this.#t(chatText.restart));
			restart.className = 'restart';
			restart.addEventListener('click', () => void this.restart());
			header.append(heading, restart);
			this.#log = document.createElement('div');
			this.#log.className = 'log';
			this.#log.setAttribute('role', 'log');
			this.#log.setAttribute('aria-label', this.#t(chatText.log));
			this.#log.setAttribute('aria-live', 'off');
			const footer = document.createElement('footer');
			footer.className = 'footer';
			this.#status = document.createElement('div');
			this.#status.className = 'status';
			this.#skip = this.#button(this.#t(chatText.skip));
			this.#skip.hidden = true;
			this.#skip.addEventListener('click', () => this.skip());
			const live = document.createElement('div');
			live.className = 'sr-only';
			this.#announcer = new Announcer(live);
			footer.append(this.#status, this.#skip, live);
			shell.append(header, this.#log, footer);
			root.append(style, shell);
			this.#initialized = true;
		}
		const panel = this.closest('#assistant-side-panel');
		this.#panelObserver?.disconnect();
		if (panel) {
			const update = () => {
				const open = panel.hasAttribute('open');
				this.hidden = !open;
				if (!open && this.#config.finishOnHide) this.skip();
			};
			this.#panelObserver = new MutationObserver(update);
			this.#panelObserver.observe(panel, { attributes: true, attributeFilter: ['open'] });
			update();
		}
	}
	public disconnectedCallback(): void {
		this.#panelObserver?.disconnect();
		this.#abort?.abort();
	}
	#button(label: string): HTMLButtonElement {
		const b = document.createElement('button');
		b.type = 'button';
		b.textContent = label;
		return b;
	}
	#event(name: string, detail: unknown): void {
		this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
	}
	#scroll(): void {
		this.#log.scrollTop = this.#log.scrollHeight;
	}
	public async restart(): Promise<void> {
		this.#abort?.abort();
		this.#log.replaceChildren();
		this.#store.clear();
		this.#status.textContent = '';
		this.#announcer.clear();
		this.#event('chat-restart', {});
		await this.goTo(this.#config.startNode);
	}
	public async goTo(nodeId: string): Promise<void> {
		this.#abort?.abort();
		const abort = new AbortController();
		this.#abort = abort;
		const port: DialogPort = {
			assistant: (text, id, signal) => this.#assistant(text, id, signal),
			choose: (options, signal) => this.#choose(options, signal),
			action: (id) => this.#action(id),
			delay: (ms, signal) =>
				new Promise<void>((resolve, reject) => {
					if (signal.aborted) {
						reject(new DOMException('Aborted', 'AbortError'));
						return;
					}
					const cancel = () => {
						clearTimeout(timer);
						reject(new DOMException('Aborted', 'AbortError'));
					};
					const timer = setTimeout(() => {
						signal.removeEventListener('abort', cancel);
						resolve();
					}, ms);
					signal.addEventListener('abort', cancel, { once: true });
				})
		};
		try {
			await new DialogRunner(this.#engine, port, () => this.#config.nextDelayMs).run(nodeId, abort.signal);
			if (!abort.signal.aborted) this.#event('chat-end', {});
		} catch (error) {
			if (!abort.signal.aborted) {
				this.#status.textContent = this.#t(chatText.error);
				this.#announcer.announce(this.#status.textContent);
				this.#event('chat-error', { error });
			}
		}
	}
	async #assistant(raw: string, nodeId: string, signal: AbortSignal): Promise<void> {
		const data = this.#store.add('assistant', raw, nodeId);
		const bubble = document.createElement('div');
		bubble.className = 'bubble assistant';
		const message = new ChatMessageElement();
		bubble.append(message);
		this.#log.append(bubble);
		this.#scroll();
		const text = plainText(raw);
		message.setAccessibleText(text);
		const stream = new TextStream();
		this.#stream = stream;
		this.#store.update(data.id, { status: 'streaming' });
		this.#skip.hidden = false;
		this.#status.textContent = this.#t(chatText.streaming);
		// Single full announcement. Visual animation remains aria-hidden at all times.
		this.#announcer.announce(text);
		try {
			await stream.reveal(
				text,
				effectiveCharactersPerSecond(this.#config.charactersPerSecond, this.#config.respectReducedMotion),
				signal,
				(part) => {
					message.setVisualText(part);
					this.#scroll();
				}
			);
			if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
			message.complete(raw);
			this.#store.update(data.id, { status: 'complete' });
		} catch (error) {
			this.#store.update(data.id, { status: signal.aborted ? 'cancelled' : 'error' });
			throw error;
		} finally {
			if (this.#stream === stream) this.#stream = undefined;
			this.#skip.hidden = true;
			this.#status.textContent = '';
		}
	}
	#choose(options: Option[], signal: AbortSignal): Promise<string> {
		if (!options.length) return Promise.reject(new Error('Frage ohne Antworten'));
		const choices = new ChatActionsElement();
		choices.groupLabel = this.#t(chatText.choose);
		choices.setChoices(options);
		this.#log.append(choices);
		this.#scroll();
		return new Promise((resolve, reject) => {
			const cancel = () => {
				signal.removeEventListener('abort', cancel);
				choices.remove();
				reject(new DOMException('Aborted', 'AbortError'));
			};
			signal.addEventListener('abort', cancel, { once: true });
			choices.addEventListener(
				'choice',
				(event: Event) => {
					if (signal.aborted) return;
					signal.removeEventListener('abort', cancel);
					const choice = (event as CustomEvent<Option>).detail;
					choices.disable();
					this.#store.add('user', choice.value);
					const reply = document.createElement('div');
					reply.className = 'bubble user';
					reply.textContent = choice.value;
					this.#log.append(reply);
					this.#scroll();
					this.#event('chat-select', { option: choice });
					resolve(choice.next);
				},
				{ once: true }
			);
			// Focus on the host is not sufficient for shadow-DOM buttons. Focus target inside the component.
			choices.shadowRoot?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
		});
	}
	#action(buttonId: string): void {
		const original = document.getElementById(`assistant-button-${buttonId}`);
		if (!original) {
			this.#status.textContent = this.#t(chatText.missingAction);
			this.#announcer.announce(this.#status.textContent);
			return;
		}
		const button = this.#button(original.getAttribute('value') || original.textContent?.trim() || this.#t(chatText.loginAction));
		button.addEventListener('click', () => {
			this.#event('chat-action', { id: buttonId });
			original.click();
		});
		this.#log.append(button);
		this.#scroll();
		this.#focus.focusFirstAction(this.#log);
	}
}
if (!customElements.get('guided-login')) customElements.define('guided-login', GuidedChat);
