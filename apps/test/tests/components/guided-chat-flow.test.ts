import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuidedChat } from '../../src/components/guided-chat.js';

describe('GuidedChat flow attribute', () => {
  afterEach(() => document.body.replaceChildren());

  it('loads the flow and its start node without demo/main.ts', async () => {
    const chat = new GuidedChat();
    const loader = vi.fn(async (name: string) => ({
      startNode: 'welcome',
      nodes: { welcome: { type: 'text', text: `Selected ${name}` } },
    }));
    chat.flowLoader = loader;
    chat.initializeTranslations = async () => {};
    chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
    chat.setAttribute('flow', 'first');
    document.body.append(chat);
    await vi.waitFor(() => expect(chat.messages.some(message => message.text === 'Selected first')).toBe(true));
    expect(loader).toHaveBeenCalledWith('first');
    chat.setAttribute('flow', 'second');
    await vi.waitFor(() => expect(chat.messages.some(message => message.text === 'Selected second')).toBe(true));
    expect(chat.messages.some(message => message.text === 'Selected first')).toBe(false);
  });
});
