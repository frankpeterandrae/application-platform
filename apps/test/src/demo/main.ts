/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import '../index.js';
import { loadFlow } from '../flows/index.js';
import { i18n } from '../shared/translations/index.js';
import type { GuidedChat } from '../components/guided-chat.js';
const chat = document.querySelector<GuidedChat>('guided-login');
if (!chat) throw new Error('guided-login element missing');
chat.configure({ charactersPerSecond: 35, nextDelayMs: 350 });
try {
	await i18n.init();
	// Optional fallback locale, loaded explicitly because t() is synchronous.
	if (i18n.getLanguage() !== 'de') await i18n.loadLanguage('de');
	chat.translator = (key) => i18n.t(key);
	const flow = await loadFlow(chat.getAttribute('flow') ?? 'demo');
	chat.configure({ startNode: flow.startNode });
	chat.nodes = flow.nodes;
} catch (error) {
	console.error('Chat initialization failed', error);
	chat.dispatchEvent(new CustomEvent('chat-error', { detail: { error } }));
}
document.getElementById('assistant-button-eid')?.addEventListener('click', () => console.info('Example login action triggered'));
document
	.getElementById('toggle')
	?.addEventListener('click', () => document.getElementById('assistant-side-panel')?.toggleAttribute('open'));
