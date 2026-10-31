/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { DialogNode } from '../types/chat.types.js';
import { i18n } from '../shared/translations/index.js';
/** Existing getFlow() shape preserved. A fresh map enables language changes. */
export function getFlow(): Record<string, DialogNode> {
	return {
		entry_node_welcome: {
			id: 'entry_node_welcome',
			type: 'text',
			text: i18n.t('guided_login.entry.text.welcome'),
			next: 'entry_node_question'
		},
		entry_node_question: {
			id: 'entry_node_question',
			type: 'question',
			text: i18n.t('guided_login.entry.question'),
			options: [
				{ value: i18n.t('guided_login.entry.fast_path'), next: 'eid_info' },
				{ value: i18n.t('guided_login.entry.select_device'), next: 'more' }
			]
		},
		eid_info: { id: 'eid_info', type: 'text', text: i18n.t('guided_login.eid.info'), next: 'eid_result' },
		eid_result: { id: 'eid_result', type: 'result', text: i18n.t('guided_login.eid.result'), resultButtonId: 'eid' },
		more: {
			id: 'more',
			type: 'question',
			text: i18n.t('guided_login.more.question'),
			options: [{ value: i18n.t('guided_login.more.restart'), next: 'entry_node_welcome' }]
		}
	};
}
