/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { DialogNode } from '../types/chat.types.js';
import { i18n } from '../shared/translations/index.js';
export function getFlow(): Record<string, DialogNode> {
	return {
		welcome: {
			id: 'welcome',
			type: 'question',
			text: i18n.t('short.welcome'),
			options: [{ value: i18n.t('short.answer'), next: 'info' }]
		},
		info: { id: 'info', type: 'text', text: i18n.t('short.info') }
	};
}
