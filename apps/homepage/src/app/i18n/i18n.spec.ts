/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';

import { i18nTextModules } from './i18n';

describe('i18nTextModules', () => {
	it('should be defined', () => {
		expect(i18nTextModules).toBeDefined();
	});

	it('should be an object', () => {
		expect(typeof i18nTextModules).toBe('object');
	});

	it('should have AppComponent property', () => {
		expect(i18nTextModules.AppComponent).toBeDefined();
	});

	it('should have correct menu structure', () => {
		expect(i18nTextModules.AppComponent.menu).toBeDefined();
		expect(i18nTextModules.AppComponent.menu.lbl).toBeDefined();
	});

	it('should have Home menu label key', () => {
		expect(i18nTextModules.AppComponent.menu.lbl.Home).toBe('AppComponent.menu.lbl.Home');
	});

	it('should have InDevelopment menu label key', () => {
		expect(i18nTextModules.AppComponent.menu.lbl.InDevelopment).toBe('AppComponent.menu.lbl.InDevelopment');
	});

	it('should have PaintRack menu label key', () => {
		expect(i18nTextModules.AppComponent.menu.lbl.PaintRack).toBe('AppComponent.menu.lbl.PaintRack');
	});

	it('should have Test menu label key', () => {
		expect(i18nTextModules.AppComponent.menu.lbl.Test).toBe('AppComponent.menu.lbl.Test');
	});
});
