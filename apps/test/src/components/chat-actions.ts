import type { Option } from '../types/chat.types.js';
import { TextStream } from '../streaming/text-stream.js';
import { effectiveCharactersPerSecond } from '../accessibility/motion-preferences.js';

/** Answers are revealed sequentially, with the complete accessible label available immediately. */
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
    const group = this.createGroup();
    for (const choice of choices) group.append(this.createButton(choice, choice.value));
  }

  public async revealChoices(
    choices: Option[],
    charactersPerSecond: number,
    signal: AbortSignal,
    respectReducedMotion: boolean,
    onUpdate: () => void,
    onStream: (stream: TextStream | undefined) => void,
  ): Promise<void> {
    const group = this.createGroup();
    const cps = effectiveCharactersPerSecond(charactersPerSecond, respectReducedMotion);
    const revealNext = async (index: number): Promise<void> => {
      if (index >= choices.length) return;
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const choice = choices[index]!;
      const button = this.createButton(choice, '');
      button.disabled = true;
      const visual = button.firstElementChild as HTMLSpanElement;
      group.append(button);
      onUpdate();
      const stream = new TextStream();
      onStream(stream);
      // Keep the accessible label stable while only the visual text changes.
      await stream.reveal(choice.value, cps, signal, part => {
        visual.textContent = part;
        onUpdate();
      });
      await revealNext(index + 1);
    };
    try {
      await revealNext(0);
      group.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; });
      onUpdate();
    } finally {
      onStream(undefined);
    }
  }

  public select(choice: Option): void {
    this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      const selected = button.dataset.next === choice.next && button.getAttribute('aria-label') === choice.value;
      button.classList.toggle('selected', selected);
      if (selected) button.setAttribute('aria-pressed', 'true');
      button.disabled = true;
    });
  }

  public disable(): void {
    this.shadowRoot?.querySelectorAll('button').forEach(button => { button.disabled = true; });
  }

  public focusFirst(): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }

  private createGroup(): HTMLDivElement {
    const root = this.shadowRoot!;
    const group = document.createElement('div');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', this.groupLabel);
    root.querySelector('[role="group"]')?.remove();
    root.append(group);
    return group;
  }

  private createButton(choice: Option, visualText: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.next = choice.next;
    button.setAttribute('aria-label', choice.value);
    const visible = document.createElement('span');
    visible.setAttribute('aria-hidden', 'true');
    visible.textContent = visualText;
    button.append(visible);
    button.addEventListener('click', () => this.dispatchEvent(new CustomEvent('choice', {
      detail: { ...choice }, bubbles: true, composed: true,
    })));
    return button;
  }
}
if (!customElements.get('chat-actions')) customElements.define('chat-actions', ChatActionsElement);
