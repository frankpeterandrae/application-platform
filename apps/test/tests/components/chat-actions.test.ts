import { describe, expect, it, vi } from 'vitest';
import { ChatActionsElement } from '../../src/components/chat-actions.js';
describe('ChatActionsElement', () => {
  it('emits the selected option and disables buttons', () => {
    const actions = new ChatActionsElement(); const selected = vi.fn(); actions.addEventListener('choice', selected);
    actions.setChoices([{ value: 'Ja', next: 'next' }]); actions.shadowRoot?.querySelector('button')?.click();
    expect(selected).toHaveBeenCalledOnce(); expect(selected.mock.calls[0]?.[0].detail.next).toBe('next');
    actions.disable(); expect(actions.shadowRoot?.querySelector('button')?.disabled).toBe(true);
  });
});

describe('ChatActionsElement selection state', () => {
  it('retains an accessible selected state after disabling choices', () => {
    const actions = new ChatActionsElement();
    const chosen = { value: 'Ausweis', next: 'eid' };
    actions.setChoices([chosen, { value: 'Andere', next: 'other' }]);
    actions.select(chosen);
    const buttons = Array.from(actions.shadowRoot!.querySelectorAll('button'));
    expect(buttons[0]?.classList.contains('selected')).toBe(true);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0]?.disabled).toBe(true);
    expect(buttons[1]?.classList.contains('selected')).toBe(false);
    expect(buttons[1]?.disabled).toBe(true);
  });
});
