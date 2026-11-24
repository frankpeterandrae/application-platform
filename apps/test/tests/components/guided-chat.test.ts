import { describe, expect, it, vi } from 'vitest';
import { GuidedChat } from '../../src/components/guided-chat.js';
describe('GuidedChat', () => {
  it('renders complete question, selection and result without Carbon', async () => {
    const chat = new GuidedChat(); chat.initializeTranslations = async () => {}; chat.flowLoader = async () => ({ startNode: 'entry_node_welcome', nodes: { entry_node_welcome: { type: 'question', text: 'PIN vorhanden?', options: [{ value: 'Ja', next: 'done' }] }, done: { type: 'text', text: 'Weiter geht es.' } } }); chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
    chat.assistantAvatar = '/assets/assistant.svg';
    chat.assistantAvatarDark = '/assets/assistant-dark.svg';
    document.body.append(chat);
    await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('chat-actions button')).toBeNull()); // shadow encapsulation
    await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('chat-actions')?.shadowRoot?.querySelector('button')).toBeTruthy());
    const message = chat.shadowRoot?.querySelector('chat-message');
    expect(message?.avatarUrl).toBe('/assets/assistant.svg');
    expect(message?.avatarUrlDark).toBe('/assets/assistant-dark.svg');
    expect(chat.shadowRoot?.querySelector('.scroll-down picture.scroll-icon img')).toBeTruthy();
    chat.assistantAvatar = '/assets/another.svg';
    expect(message?.avatarUrl).toBe('/assets/another.svg');
    const live = chat.shadowRoot?.querySelector('[aria-live="polite"]'); expect(live?.textContent).toBe('PIN vorhanden?');
    chat.shadowRoot?.querySelector('chat-actions')?.shadowRoot?.querySelector('button')?.click();
    await vi.waitFor(() => expect(chat.messages.some(message => message.text === 'Weiter geht es.')).toBe(true));
    expect(chat.messages.some(message => message.role === 'user' && message.text === 'Ja')).toBe(true);
    const userMessage = chat.shadowRoot?.querySelector<HTMLElement>('.bubble.user chat-message');
    expect(userMessage?.getAttribute('message-role')).toBe('user');
    expect(userMessage?.avatarUrl).toBe('');
    expect(userMessage?.shadowRoot?.querySelector('.label')?.textContent).toBe('chat.user');
    expect(userMessage?.shadowRoot?.querySelector('.visual')?.textContent).toBe('Ja');
    chat.assistantAvatar = '/assets/third.svg';
    expect(userMessage?.avatarUrl).toBe('');
    chat.remove();
  });
});
