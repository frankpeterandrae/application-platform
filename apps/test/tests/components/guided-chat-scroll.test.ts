import { describe, expect, it, vi } from 'vitest';
import { GuidedChat } from '../../src/components/guided-chat.js';

describe('GuidedChat scrolling', () => {
  it('offers a keyboard-usable jump button when the reader scrolls up', async () => {
    const chat = new GuidedChat();
    chat.initializeTranslations = async () => {};
    chat.flowLoader = async () => ({
      startNode: 'start',
      nodes: { start: { type: 'question', text: 'Eine Frage?', options: [{ value: 'Ja', next: 'done' }] }, done: { type: 'text', text: 'Fertig' } },
    });
    chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
    document.body.append(chat);
    await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('chat-actions')?.shadowRoot?.querySelector('button')).toBeTruthy());
    const log = chat.shadowRoot!.querySelector<HTMLElement>('.log')!;
    const down = chat.shadowRoot!.querySelector<HTMLButtonElement>('.scroll-down')!;
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(log, 'clientHeight', { configurable: true, value: 250 });
    log.scrollTop = 100;
    log.dispatchEvent(new Event('scroll'));
    expect(down.hidden).toBe(false);
    expect(down.getAttribute('aria-label')).toBeTruthy();
    down.click();
    expect(log.scrollTop).toBe(1000);
    expect(down.hidden).toBe(true);
    chat.remove();
  });

  it('does not render a skip-animation control', async () => {
    const chat = new GuidedChat();
    chat.initializeTranslations = async () => {};
    chat.flowLoader = async () => ({ startNode: 'start', nodes: { start: { type: 'text', text: 'Hallo' } } });
    chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
    document.body.append(chat);
    expect(chat.shadowRoot?.querySelector('.skip')).toBeNull();
    chat.remove();
  });
});
