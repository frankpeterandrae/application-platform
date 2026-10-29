/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { FocusManager } from '../../src/accessibility/focus-manager.js';
describe('FocusManager', () => {
	it('focuses the first enabled action and restores a trigger', () => {
		const container = document.createElement('div');
		container.innerHTML = '<button disabled>Nein</button><button>Ja</button>';
		document.body.append(container);
		const manager = new FocusManager();
		expect(manager.focusFirstAction(container)).toBe(true);
		expect(document.activeElement?.textContent).toBe('Ja');
		const trigger = document.createElement('button');
		document.body.append(trigger);
		manager.rememberTrigger(trigger);
		manager.restoreTrigger();
		expect(document.activeElement).toBe(trigger);
		container.remove();
		trigger.remove();
	});
});
