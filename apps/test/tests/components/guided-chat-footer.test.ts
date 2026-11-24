import { describe, expect, it, vi } from 'vitest';
import { GuidedChat } from '../../src/components/guided-chat.js';

describe('GuidedChat without footer', () => {
  it('renders no footer while retaining the screenreader live region', async () => {
    const chat = new GuidedChat();
    chat.initializeTranslations = async () => {};
    chat.flowLoader = async () => ({
      startNode: 'start',
      nodes: { start: { type: 'text', text: 'Hallo!' } }
    });
    chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
    document.body.append(chat);
    await vi.waitFor(() => expect(chat.messages.length).toBe(1));
    expect(chat.shadowRoot?.querySelector('footer')).toBeNull();
    expect(chat.shadowRoot?.querySelector('.status')).toBeNull();
    expect(chat.shadowRoot?.querySelector('.sr-only[aria-live]')).not.toBeNull();
    chat.remove();
  });

  it('renders flow loading failures in the conversation', async () => {
    const chat = new GuidedChat();
    chat.initializeTranslations = async () => {};
    chat.flowLoader = async () => { throw new Error('Flow failed'); };
    document.body.append(chat);
    await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('.chat-error')).not.toBeNull());
    expect(chat.shadowRoot?.querySelector('footer')).toBeNull();
    expect(chat.shadowRoot?.querySelector('.chat-error')?.textContent).toBe('chat.flowError');
    chat.remove();
  });
});
