import { afterEach, describe, expect, it } from 'vitest';
import { ResultButtonHandler } from '../../src/core/result-button-handler.js';

afterEach(() => { document.body.replaceChildren(); });

describe('ResultButtonHandler', () => {
  it('moves original FTL action to host and restores it with original attributes', () => {
    const ftl = document.createElement('div');
    ftl.style.display = 'none';
    const original = document.createElement('div');
    original.id = 'assistant-button-eid';
    original.hidden = true;
    original.style.display = 'none';
    original.setAttribute('slot', 'initial');
    const action = document.createElement('button');
    action.textContent = 'Mit Online-Ausweis anmelden';
    const clicked = { count: 0 };
    action.addEventListener('click', () => clicked.count++);
    original.append(action);
    const sibling = document.createElement('div');
    ftl.append(original, sibling);
    const chat = document.createElement('div');
    document.body.append(ftl, chat);
    const handler = new ResultButtonHandler(chat);
    expect(handler.attach('eid', 'result-1')).toBe(original);
    expect(original.parentElement).toBe(chat);
    expect(original.slot).toBe('result-1');
    expect(original.hidden).toBe(false);
    action.click();
    expect(clicked.count).toBe(1);
    handler.restore();
    expect(original.parentElement).toBe(ftl);
    expect(ftl.firstElementChild).toBe(original);
    expect(original.hidden).toBe(true);
    expect(original.style.display).toBe('none');
    expect(original.slot).toBe('initial');
    action.click();
    expect(clicked.count).toBe(2);
    expect(handler.attach('assistant-button-eid', 'result-2')).toBe(original);
    handler.restore();
  });

  it('does not move an unavailable element', () => {
    const host = document.createElement('div');
    const handler = new ResultButtonHandler(host);
    expect(handler.attach('missing', 'slot-1')).toBeNull();
    handler.restore();
  });
});
