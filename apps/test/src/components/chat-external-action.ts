/**
 * Lightweight wrapper for an action slot. Intentionally no Shadow DOM:
 * the slot must belong to GuidedChat's shadow tree so it can project
 * the original button from GuidedChat's light DOM.
 */
export class ChatExternalActionElement extends HTMLElement {
  private readonly actionSlot: HTMLSlotElement;

  public constructor() {
    super();
    this.actionSlot = document.createElement('slot');
    this.append(this.actionSlot);
  }

  public set slotName(value: string) {
    this.actionSlot.name = value;
  }

  public get slotName(): string {
    return this.actionSlot.name;
  }
}

if (!customElements.get('chat-external-action')) {
  customElements.define('chat-external-action', ChatExternalActionElement);
}
