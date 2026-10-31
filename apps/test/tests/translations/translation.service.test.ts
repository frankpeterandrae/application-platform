/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { I18n } from '../../src/shared/translations/translation.service.js';
describe('I18n', () => {
	it('loads, interpolates and resolves nested keys', async () => {
		const loader = vi.fn(async () => ({ chat: { hello: 'Hallo {{name}}' } }));
		const i18n = new I18n({ defaultLanguage: 'de', fallbackLanguage: 'de', loader });
		await i18n.init();
		expect(i18n.t('chat.hello', { name: 'Ada' })).toBe('Hallo Ada');
		expect(i18n.t('missing')).toBe('missing');
		await i18n.loadLanguage('de');
		expect(loader).toHaveBeenCalledTimes(1);
	});
	it('keeps language unchanged when load fails', async () => {
		const i18n = new I18n({
			defaultLanguage: 'de',
			loader: async (lang) => {
				if (lang === 'en') throw new Error('offline');
				return { ok: 'OK' };
			}
		});
		await i18n.init();
		await expect(i18n.setLanguage('en')).rejects.toThrow('offline');
		expect(i18n.getLanguage()).toBe('de');
	});
});
