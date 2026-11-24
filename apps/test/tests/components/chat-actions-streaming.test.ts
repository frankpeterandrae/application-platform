import { describe, expect, it, vi } from 'vitest';
import { ChatActionsElement } from '../../src/components/chat-actions.js';

describe('ChatActionsElement animated answers', () => {
  it('reveals successive answers and enables them only after completion', async () => {
    const actions = new ChatActionsElement();
    const onUpdate = vi.fn();
    const onStream = vi.fn();
    const finished = actions.revealChoices([
      { value: 'Ja', next: 'a' },
      { value: 'Nein', next: 'b' },
    ], 0, new AbortController().signal, true, onUpdate, onStream);
    await finished;
    const buttons = Array.from(actions.shadowRoot!.querySelectorAll('button'));
    expect(buttons.map(button => button.textContent)).toEqual(['Ja', 'Nein']);
    expect(buttons.every(button => !button.disabled)).toBe(true);
    expect(onUpdate).toHaveBeenCalled();
    expect(onStream).toHaveBeenCalledWith(undefined);
  });

  it('does not reveal more answers after abort', async () => {
    const actions = new ChatActionsElement();
    const controller = new AbortController();
    const promise = actions.revealChoices([
      { value: 'Eine sehr lange Antwort', next: 'a' },
      { value: 'Zweite Antwort', next: 'b' },
    ], 1, controller.signal, true, () => {}, () => {});
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(actions.shadowRoot!.querySelectorAll('button')).toHaveLength(1);
  });
});
