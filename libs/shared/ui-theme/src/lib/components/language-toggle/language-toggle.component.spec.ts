/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import type { MockScopedTranslationService } from '@application-platform/testing';

import { setupTestingModule } from '../../../test-setup';

import { LanguageToggleComponent } from './language-toggle.component';

describe('LanguageToggleComponent', () => {
	let component: LanguageToggleComponent;
	let fixture: ComponentFixture<LanguageToggleComponent>;
	let mockTranslationService: MockScopedTranslationService;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [LanguageToggleComponent]
		});

		fixture = TestBed.createComponent(LanguageToggleComponent);
		component = fixture.componentInstance;
		mockTranslationService = TestBed.inject(ScopedTranslationServiceInterface) as unknown as MockScopedTranslationService;

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize language property correctly', () => {
		expect(component.language).toBe(mockTranslationService.currentLang);
	});

	it('should call toggleLanguage on service when toggleLanguage is called', () => {
		component.toggleLanguage();
		expect(mockTranslationService.toggleLanguage).toHaveBeenCalled();
	});
});
