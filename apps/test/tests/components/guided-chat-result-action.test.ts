import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuidedChat } from '../../src/components/guided-chat.js';

afterEach(() => { document.body.replaceChildren(); });

describe('GuidedChat resultButtonId integration', () => {
  it('projects the original button and restores it on restart', async () => {
    const ftl = document.createElement('div');
    ftl.style.display = 'none';
    const container = document.createElement('div');
    container.id = 'assistant-button-bundid';
    const action = document.createElement('button');
    action.textContent = 'Weiter zur BundID';
    let clicks = 0;
    action.addEventListener('click', () => clicks++);
    container.append(action);
    ftl.append(container);
    document.body.append(ftl);

    const chat = new GuidedChat();
    chat.initializeTranslations = async () => {};
    chat.flowLoader = async () => ({ startNode: 'result', nodes: {
      result: { type: 'result', text: 'Weiter zur Anmeldung', resultButtonId: 'bundid' }
    }});
    chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
    document.body.append(chat);

    await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('chat-external-action slot')).toBeTruthy());
    const slot = chat.shadowRoot?.querySelector<HTMLSlotElement>('chat-external-action slot');
    expect(slot?.name).toBe(container.slot);
    expect(container.parentElement).toBe(chat);
    action.click();
    expect(clicks).toBe(1);
    await chat.restart();
    expect(chat.querySelectorAll('#assistant-button-bundid')).toHaveLength(1);
    expect(container.parentElement).toBe(chat);
    chat.remove();
    expect(container.parentElement).toBe(ftl);
    expect(ftl.style.display).toBe('none');
  });

  it('reports a missing action without synthesizing a login URL', async () => {
    const chat = new GuidedChat();
    chat.initializeTranslations = async () => {};
    chat.flowLoader = async () => ({ startNode: 'result', nodes: {
      result: { type: 'result', text: 'Weiter', resultButtonId: 'unknown' }
    }});
    chat.configure({ charactersPerSecond: 0 });
    const errors: unknown[] = [];
    chat.addEventListener('chat-error', event => errors.push((event as CustomEvent).detail));
    document.body.append(chat);
    await vi.waitFor(() => expect(errors.length).toBe(1));
    expect(chat.shadowRoot?.querySelector('.chat-error')).toBeTruthy();
  });
});
