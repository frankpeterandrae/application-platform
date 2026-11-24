import { safeFragment } from '../content.js';
import { ThemeImage } from './theme-image.js';

/** An assistant message. The avatar is decorative; the message remains accessible without it. */
export class ChatMessageElement extends HTMLElement {
  #visual: HTMLSpanElement;
  #accessible: HTMLSpanElement;
  #avatar: ThemeImage;
  #label: HTMLSpanElement;

  public static get observedAttributes(): string[] { return ['avatar-url', 'avatar-url-dark']; }

  public constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('../styles/chat-message.css', import.meta.url).href;

    this.#avatar = new ThemeImage('avatar');

    this.#label = document.createElement('span');
    this.#label.className = 'label';
    this.#label.setAttribute('aria-hidden', 'true');

    this.#visual = document.createElement('span');
    this.#visual.className = 'visual';
    this.#visual.setAttribute('aria-hidden', 'true');

    this.#accessible = document.createElement('span');
    this.#accessible.className = 'sr-only';

    const content = document.createElement('div');
    content.className = 'content';
    content.append(this.#label, this.#visual, this.#accessible);
    root.append(style, this.#avatar.element, content);
  }

  public get avatarUrl(): string { return this.getAttribute('avatar-url') ?? ''; }
  public set avatarUrl(value: string) {
    if (value) this.setAttribute('avatar-url', value);
    else this.removeAttribute('avatar-url');
  }

  public get avatarUrlDark(): string { return this.getAttribute('avatar-url-dark') ?? ''; }
  public set avatarUrlDark(value: string) {
    if (value) this.setAttribute('avatar-url-dark', value);
    else this.removeAttribute('avatar-url-dark');
  }
  public attributeChangedCallback(): void {
    this.#avatar.setUrls(this.avatarUrl, this.avatarUrlDark);
  }

  /** Visible speaker label. The chat's live-region handles screenreader announcements. */
  public setSpeakerLabel(value: string): void { this.#label.textContent = value; }
  /** Kept for compatibility with existing assistant messages. */
  public setAssistantLabel(value: string): void { this.setSpeakerLabel(value); }
  public setVisualText(value: string): void { this.#visual.textContent = value; }
  public setAccessibleText(value: string): void { this.#accessible.textContent = value; }
  public complete(raw: string): void { this.#visual.replaceChildren(safeFragment(raw)); }

}

if (!customElements.get('chat-message')) customElements.define('chat-message', ChatMessageElement);
