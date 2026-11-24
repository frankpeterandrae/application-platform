/**
 * Moves an existing FTL/Keycloak action into the chat's light DOM for slot
 * projection. Never clones or re-creates the authentication element.
 */
interface OriginalPosition {
  parent: Node;
  nextSibling: Node | null;
  slot: string | null;
  hidden: boolean;
  display: string;
}

export class ResultButtonHandler {
  private readonly positions = new Map<HTMLElement, OriginalPosition>();

  public constructor(private readonly host: HTMLElement) {}

  public attach(buttonId: string, slotName: string): HTMLElement | null {
    // Existing flows may use either 'eid' or 'assistant-button-eid'.
    const id = buttonId.startsWith('assistant-button-')
      ? buttonId
      : `assistant-button-${buttonId}`;
    const element = document.getElementById(id);
    if (!element || element === this.host || element.contains(this.host)) return null;

    if (!this.positions.has(element)) {
      if (!element.parentNode) return null;
      this.positions.set(element, {
        parent: element.parentNode,
        nextSibling: element.nextSibling,
        slot: element.getAttribute('slot'),
        hidden: element.hidden,
        display: element.style.display
      });
    }

    element.slot = slotName;
    element.hidden = false;
    element.style.removeProperty('display');
    this.host.append(element);
    return element;
  }

  public restore(): void {
    for (const [element, position] of this.positions) {
      if (position.slot === null) element.removeAttribute('slot');
      else element.slot = position.slot;
      element.hidden = position.hidden;
      element.style.display = position.display;

      if (position.nextSibling?.parentNode === position.parent) {
        position.parent.insertBefore(element, position.nextSibling);
      } else {
        position.parent.appendChild(element);
      }
    }
    this.positions.clear();
  }
}
