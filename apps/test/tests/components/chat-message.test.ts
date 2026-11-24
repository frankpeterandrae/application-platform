import { describe, expect, it } from 'vitest';
import { ChatMessageElement } from '../../src/components/chat-message.js';
describe('ChatMessageElement', () => {
  it('hides animated visuals from assistive technology and preserves safe text', () => {
    const message = new ChatMessageElement(); message.setVisualText('Hal');
    expect(message.shadowRoot?.querySelector('[aria-hidden="true"]')?.textContent).toBe('Hal');
    message.setAccessibleText('Hallo'); message.complete('<strong>Hallo</strong><script>alert(1)</script>');
    expect(message.shadowRoot?.querySelector('strong')?.textContent).toBe('Hallo');
    expect(message.shadowRoot?.textContent).toContain('Hallo');
    expect(message.shadowRoot?.querySelector('script')).toBeNull();
  });

  it('renders a user reply label without an avatar', () => {
    const message = new ChatMessageElement();
    message.setAttribute('message-role', 'user');
    message.setSpeakerLabel('Sie');
    message.setVisualText('Ja');
    expect(message.shadowRoot?.querySelector('.label')?.textContent).toBe('Sie');
    expect(message.shadowRoot?.querySelector('.visual')?.textContent).toBe('Ja');
    expect(message.avatarUrl).toBe('');
  });

  it('accepts a URL avatar and ignores unsupported protocols', () => {
    const message = new ChatMessageElement();
    message.avatarUrl = '/assets/assistant.svg';
    const avatar = message.shadowRoot?.querySelector('img');
    expect(avatar?.getAttribute('src')).toContain('/assets/assistant.svg');
    expect(avatar?.getAttribute('alt')).toBe('');
    message.avatarUrl = 'javascript:alert(1)';
    expect(avatar?.hasAttribute('src')).toBe(false);
    message.avatarUrl = '';
    expect(message.shadowRoot?.querySelector('picture.avatar')?.hidden).toBe(true);
  });
  it('supports a dark avatar variant without applying it to user replies', () => {
    const message = new ChatMessageElement();
    message.avatarUrl = '/light.svg';
    message.avatarUrlDark = '/dark.svg';
    const picture = message.shadowRoot?.querySelector('picture.avatar');
    expect(picture?.querySelector('source')?.getAttribute('srcset')).toContain('/dark.svg');
    expect(picture?.querySelector('source')?.media).toBe('(prefers-color-scheme: dark)');
    message.setAttribute('message-role', 'user');
    expect(message.getAttribute('message-role')).toBe('user');
  });

});
