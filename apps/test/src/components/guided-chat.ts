import { ChatEngine } from '../core/chat-engine.js';
import { DialogRunner, type DialogPort } from '../core/dialog-runner.js';
import { MessageStore } from '../core/message-store.js';
import { TextStream } from '../streaming/text-stream.js';
import { Announcer } from '../accessibility/announcer.js';
import { FocusManager } from '../accessibility/focus-manager.js';
import { effectiveCharactersPerSecond } from '../accessibility/motion-preferences.js';
import { plainText } from '../content.js';
import { chatText } from '../i18n/keys.js';
import { loadFlow } from '../flows/index.js';
import { i18n } from '../shared/translations/index.js';
import type { FlowDefinition } from '../flows/flow.types.js';
import { ChatMessageElement } from './chat-message.js';
import { ChatActionsElement } from './chat-actions.js';
import { ThemeImage } from './theme-image.js';
import { ResultButtonHandler } from '../core/result-button-handler.js';
import { ChatExternalActionElement } from './chat-external-action.js';
import type { NodeSource, NodeHandler, ChatOptions, Option } from '../types/chat.types.js';

const DEFAULTS: ChatOptions = { startNode: 'entry_node_welcome', charactersPerSecond: 42, nextDelayMs: 250, respectReducedMotion: true, finishOnHide: true };
export class GuidedChat extends HTMLElement {
  #config: ChatOptions = { ...DEFAULTS };
  #engine = new ChatEngine();
  #store = new MessageStore();
  #focus = new FocusManager();
  #resultButtons = new ResultButtonHandler(this);
  #actionSequence = 0;
  #stream?: TextStream;
  #abort?: AbortController;
  #panelObserver?: MutationObserver;
  #initialized = false;
  #flowRevision = 0;
  #following = true;
  #scrollFrame?: number;
  #resizeObserver?: ResizeObserver;
  #scrollDown!: HTMLButtonElement;
  #scrollIcon!: ThemeImage;
  /** Override before connecting to integrate a different application's flow registry. */
  public flowLoader: (name: string) => Promise<FlowDefinition> = loadFlow;
  /** Override before connecting to integrate an existing translation service. */
  public initializeTranslations: () => Promise<void> = () => i18n.init();
  #translate: (key: string) => string = key => i18n.t(key);
  public static get observedAttributes(): string[] { return ['flow', 'assistant-avatar', 'assistant-avatar-dark', 'scroll-icon', 'scroll-icon-dark']; }
  public attributeChangedCallback(name: string, oldValue: string | null, value: string | null): void {
    if (name === 'flow' && oldValue !== value && this.isConnected && this.#initialized) void this.loadSelectedFlow();
    if (oldValue !== value && ['assistant-avatar', 'assistant-avatar-dark'].includes(name)) this.#refreshAvatars();
    if (oldValue !== value && ['scroll-icon', 'scroll-icon-dark'].includes(name) && this.#initialized) this.#refreshScrollIcon();
  }
  public async loadSelectedFlow(): Promise<void> {
    const revision = ++this.#flowRevision;
    this.#abort?.abort();
    if (this.#initialized) this.#announcer.announce(this.#t(chatText.loading));
    try {
      await this.initializeTranslations();
      if (revision !== this.#flowRevision || !this.isConnected) return;
      this.#refreshLabels();
      const definition = await this.flowLoader(this.getAttribute('flow') ?? 'demo');
      if (revision !== this.#flowRevision || !this.isConnected) return;
      this.#config = { ...this.#config, startNode: definition.startNode };
      this.#engine.source = definition.nodes;
      await this.restart();
    } catch (error) {
      if (revision !== this.#flowRevision || !this.isConnected) return;
      this.#showError(chatText.flowError);
      this.#event('chat-error', { error });
    }
  }
  /** URL of the assistant avatar, also configurable through the assistant-avatar attribute. */
  public get assistantAvatar(): string { return this.getAttribute('assistant-avatar') ?? ''; }
  public set assistantAvatar(value: string) {
    if (value) this.setAttribute('assistant-avatar', value);
    else this.removeAttribute('assistant-avatar');
  }
  public get assistantAvatarDark(): string { return this.getAttribute('assistant-avatar-dark') ?? ''; }
  public set assistantAvatarDark(value: string) {
    if (value) this.setAttribute('assistant-avatar-dark', value);
    else this.removeAttribute('assistant-avatar-dark');
  }
  public get scrollIcon(): string { return this.getAttribute('scroll-icon') ?? ''; }
  public set scrollIcon(value: string) {
    if (value) this.setAttribute('scroll-icon', value);
    else this.removeAttribute('scroll-icon');
  }
  public get scrollIconDark(): string { return this.getAttribute('scroll-icon-dark') ?? ''; }
  public set scrollIconDark(value: string) {
    if (value) this.setAttribute('scroll-icon-dark', value);
    else this.removeAttribute('scroll-icon-dark');
  }
  #refreshScrollIcon(): void {
    const defaultLight = new URL('../assets/icons/arrow-down-light.svg', import.meta.url).href;
    const defaultDark = new URL('../assets/icons/arrow-down-dark.svg', import.meta.url).href;
    this.#scrollIcon.setUrls(this.scrollIcon || defaultLight, this.scrollIconDark || (this.scrollIcon ? this.scrollIcon : defaultDark));
  }
  #refreshAvatars(): void {
    this.shadowRoot?.querySelectorAll<ChatMessageElement>('chat-message').forEach(message => {
      if (message.getAttribute('message-role') !== 'user') {
        message.avatarUrl = this.assistantAvatar;
        message.avatarUrlDark = this.assistantAvatarDark;
      }
    });
  }
  public set translator(fn: (key: string) => string) { this.#translate = fn; this.#refreshLabels(); }
  #t(key: string): string { return this.#translate(key); }
  #refreshLabels(): void {
    if (!this.#initialized) return;
    this.shadowRoot?.querySelector('.chat')?.setAttribute('aria-label', this.#t(chatText.region));
    const heading = this.shadowRoot?.querySelector('.header strong');
    if (heading) heading.textContent = this.#t(chatText.heading);
    const restart = this.shadowRoot?.querySelector<HTMLButtonElement>('.restart');
    if (restart) restart.textContent = this.#t(chatText.restart);
    this.#log.setAttribute('aria-label', this.#t(chatText.log));
    this.#scrollDown.setAttribute('aria-label', this.#t(chatText.scrollDown));
    this.#scrollDown.title = this.#t(chatText.scrollDown);
    this.shadowRoot?.querySelectorAll<ChatMessageElement>('chat-message').forEach(message => {
      message.setSpeakerLabel(this.#t(message.getAttribute('message-role') === 'user' ? chatText.user : chatText.assistant));
    });
  }
  #log!: HTMLDivElement;
  #announcer!: Announcer;
  public constructor() { super(); this.attachShadow({ mode: 'open' }); }
  public set nodes(source: NodeSource) { this.#engine.source = source; if (this.isConnected) void this.restart(); }
  public configure(config: Partial<ChatOptions>): void { this.#config = { ...this.#config, ...config }; }
  public registerHandler(type: string, handler: NodeHandler): () => void { return this.#engine.register(type, handler); }
  public get messages() { return this.#store.messages; }
  #finishCurrentAnimation(): void { this.#stream?.skip(); }
  public connectedCallback(): void {
    if (!this.#initialized) {
      const root = this.shadowRoot!;
      const style = document.createElement("link"); style.rel = "stylesheet"; style.href = new URL("../styles/chat.css", import.meta.url).href;
      const shell = document.createElement('section'); shell.className = 'chat'; shell.setAttribute('aria-label', this.#t(chatText.region));
      const header = document.createElement('header'); header.className = 'header';
      const heading = document.createElement('strong'); heading.textContent = this.#t(chatText.heading);
      const restart = this.#button(this.#t(chatText.restart)); restart.className = 'restart'; restart.addEventListener('click', () => void this.restart());
      header.append(heading, restart);
      this.#log = document.createElement('div'); this.#log.className = 'log';
      this.#log.addEventListener('scroll', () => {
        this.#following = this.#isNearBottom();
        this.#updateScrollButton();
      });
      this.#log.setAttribute('role', 'log'); this.#log.setAttribute('aria-label', this.#t(chatText.log)); this.#log.setAttribute('aria-live', 'off');
      const logArea = document.createElement('div'); logArea.className = 'log-area';
      this.#scrollDown = this.#button(''); this.#scrollDown.className = 'scroll-down';
      this.#scrollIcon = new ThemeImage('scroll-icon');
      this.#scrollDown.append(this.#scrollIcon.element);
      this.#scrollDown.setAttribute('aria-label', this.#t(chatText.scrollDown));
      this.#scrollDown.title = this.#t(chatText.scrollDown);
      this.#scrollDown.hidden = true;
      this.#scrollDown.addEventListener('click', () => {
        this.#following = true;
        this.#scrollToBottom();
      });
      logArea.append(this.#log, this.#scrollDown);
      const live = document.createElement('div'); live.className = 'sr-only'; this.#announcer = new Announcer(live);
      shell.append(header, logArea, live); root.append(style, shell);
      if (typeof ResizeObserver !== 'undefined') {
        this.#resizeObserver = new ResizeObserver(() => this.#scroll());
        this.#resizeObserver.observe(this.#log);
      }
      this.#initialized = true;
      this.#refreshScrollIcon();
    }
    if (this.#resizeObserver) this.#resizeObserver.observe(this.#log);
    void this.loadSelectedFlow();
    const panel = this.closest('#assistant-side-panel');
    this.#panelObserver?.disconnect();
    if (panel) {
      const update = () => { const open = panel.hasAttribute('open'); this.hidden = !open; if (!open && this.#config.finishOnHide) this.#finishCurrentAnimation(); };
      this.#panelObserver = new MutationObserver(update);
      this.#panelObserver.observe(panel, { attributes: true, attributeFilter: ['open'] }); update();
    }
  }
  public disconnectedCallback(): void {
    ++this.#flowRevision; this.#panelObserver?.disconnect(); this.#abort?.abort();
    this.#resizeObserver?.disconnect();
    this.#resultButtons.restore();
    if (this.#scrollFrame !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.#scrollFrame);
  }
  #showError(key: string): void {
    const text = this.#t(key);
    const error = document.createElement('div');
    error.className = 'chat-error';
    error.textContent = text;
    this.#log.append(error);
    this.#scroll();
    this.#announcer.announce(text);
  }
  #button(label: string): HTMLButtonElement { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; return b; }
  #event(name: string, detail: unknown): void { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }
  #isNearBottom(): boolean {
    return this.#log.scrollHeight - this.#log.clientHeight - this.#log.scrollTop <= 48;
  }
  #updateScrollButton(): void {
    this.#scrollDown.hidden = this.#isNearBottom();
  }
  #scrollToBottom(): void {
    this.#log.scrollTop = this.#log.scrollHeight;
    this.#updateScrollButton();
  }
  #scroll(): void {
    // Layout updates (especially reduced-motion, font loading, and new options)
    // can finish after the synchronous append. Recheck on the next frame.
    if (this.#following) this.#scrollToBottom();
    else this.#updateScrollButton();
    if (typeof requestAnimationFrame !== 'function') return;
    if (this.#scrollFrame !== undefined) cancelAnimationFrame(this.#scrollFrame);
    this.#scrollFrame = requestAnimationFrame(() => {
      this.#scrollFrame = undefined;
      if (this.#following) this.#scrollToBottom();
      else this.#updateScrollButton();
    });
  }
  public async restart(): Promise<void> { this.#abort?.abort(); this.#resultButtons.restore(); this.#log.replaceChildren(); this.#following = true; this.#updateScrollButton(); this.#store.clear(); this.#announcer.clear(); this.#event('chat-restart', {}); await this.goTo(this.#config.startNode); }
  public async goTo(nodeId: string): Promise<void> {
    this.#abort?.abort(); const abort = new AbortController(); this.#abort = abort;
    const port: DialogPort = {
      assistant: (text, id, signal) => this.#assistant(text, id, signal),
      choose: (options, signal) => this.#choose(options, signal),
      action: id => this.#action(id),
      delay: (ms, signal) => new Promise<void>((resolve, reject) => {
        if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
        const cancel = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
        signal.addEventListener('abort', cancel, { once: true });
      })
    };
    try {
      await new DialogRunner(this.#engine, port, () => this.#config.nextDelayMs).run(nodeId, abort.signal);
      if (!abort.signal.aborted) this.#event('chat-end', {});
    } catch (error) {
      if (!abort.signal.aborted) { this.#showError(chatText.error); this.#event('chat-error', { error }); }
    }
  }
  async #assistant(raw: string, nodeId: string, signal: AbortSignal): Promise<void> {
    const data = this.#store.add('assistant', raw, nodeId);
    const bubble = document.createElement('div'); bubble.className = 'bubble assistant';
    const message = new ChatMessageElement();
    message.avatarUrl = this.assistantAvatar;
    message.avatarUrlDark = this.assistantAvatarDark;
    message.setAssistantLabel(this.#t(chatText.assistant));
    bubble.append(message); this.#log.append(bubble); this.#scroll();
    const text = plainText(raw); message.setAccessibleText(text); const stream = new TextStream(); this.#stream = stream;
    this.#store.update(data.id, { status: 'streaming' });
    // Single full announcement. Visual animation remains aria-hidden at all times.
    this.#announcer.announce(text);
    try {
      await stream.reveal(text, effectiveCharactersPerSecond(this.#config.charactersPerSecond, this.#config.respectReducedMotion), signal, part => { message.setVisualText(part); this.#scroll(); });
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      message.complete(raw); this.#store.update(data.id, { status: 'complete' }); this.#scroll();
    } catch (error) {
      this.#store.update(data.id, { status: signal.aborted ? 'cancelled' : 'error' }); throw error;
    } finally { if (this.#stream === stream) this.#stream = undefined; }
  }
  #choose(options: Option[], signal: AbortSignal): Promise<string> {
    if (!options.length) return Promise.reject(new Error('Frage ohne Antworten'));
    const choices = new ChatActionsElement(); choices.groupLabel = this.#t(chatText.choose); this.#log.append(choices); this.#scroll();
    const selection = new Promise<string>((resolve, reject) => {
      const cancel = () => { signal.removeEventListener('abort', cancel); choices.remove(); reject(new DOMException('Aborted', 'AbortError')); };
      signal.addEventListener('abort', cancel, { once: true });
      choices.addEventListener('choice', (event: Event) => {
        if (signal.aborted) return;
        signal.removeEventListener('abort', cancel);
        const choice = (event as CustomEvent<Option>).detail;
        choices.select(choice); this.#store.add('user', choice.value);
        const reply = document.createElement('div'); reply.className = 'bubble user';
        const userMessage = new ChatMessageElement();
        userMessage.setAttribute('message-role', 'user');
        userMessage.setSpeakerLabel(this.#t(chatText.user));
        userMessage.setVisualText(choice.value);
        userMessage.setAccessibleText(choice.value);
        reply.append(userMessage);
        this.#log.append(reply); this.#scroll(); this.#event('chat-select', { option: choice });
        resolve(choice.next);
      }, { once: true });
    });
    const animation = choices.revealChoices(options, this.#config.charactersPerSecond, signal, this.#config.respectReducedMotion,
      () => this.#scroll(), stream => { this.#stream = stream; });
    // Choice listeners are active while the buttons are revealed. Only finished buttons are clickable.
    void animation.then(() => {
      if (!signal.aborted && choices.isConnected) {
        choices.focusFirst();
        this.#scroll();
      }
    }).catch(error => {
      if (!signal.aborted) this.#event('chat-error', { error });
    });
    return selection;
  }
  #action(buttonId: string): void {
    const slotName = `guided-chat-action-${++this.#actionSequence}`;
    const wrapper = new ChatExternalActionElement();
    wrapper.slotName = slotName;
    // The original element is a direct light-DOM child of <guided-login>,
    // so it can be projected through a slot nested in the chat's Shadow DOM.
    const original = this.#resultButtons.attach(buttonId, slotName);
    if (!original) {
      this.#showError(chatText.missingAction);
      this.#event('chat-error', { error: new Error(`Action element not found: ${buttonId}`) });
      return;
    }
    this.#log.append(wrapper);
    this.#scroll();
    // Focus only after the action is attached and becomes visible.
    const action = original.matches('button, a, [tabindex], drv-ui-button')
      ? original : original.querySelector<HTMLElement>('button, a, [tabindex], drv-ui-button');
    action?.focus();
    this.#event('chat-action-visible', { id: buttonId });
  }
}
if (!customElements.get('guided-login')) customElements.define('guided-login', GuidedChat);
