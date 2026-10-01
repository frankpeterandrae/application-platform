/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { createTranslocoConfig } from './transloco.config';

describe('createTranslocoConfig', () => {
	it('should create the default application translation configuration', () => {
		const config = createTranslocoConfig(false);

		expect(config).toMatchObject({
			availableLangs: ['en', 'de'],
			defaultLang: 'de',
			reRenderOnLangChange: true,
			prodMode: false
		});
	});

	it('should enable production mode', () => {
		const config = createTranslocoConfig(true);

		expect(config.prodMode).toBe(true);
	});
});
