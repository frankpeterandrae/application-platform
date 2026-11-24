import { afterEach, describe, expect, it } from 'vitest';
import { ChatExternalActionElement } from '../../src/components/chat-external-action.js';

afterEach(() => { document.body.replaceChildren(); });

describe('ChatExternalActionElement', () => {
  it('hosts a native slot without a second shadow boundary', () => {
    const wrapper = new ChatExternalActionElement();
    wrapper.slotName = 'action-1';
    expect(wrapper.shadowRoot).toBeNull();
    expect(wrapper.querySelector('slot')?.name).toBe('action-1');
  });
});
