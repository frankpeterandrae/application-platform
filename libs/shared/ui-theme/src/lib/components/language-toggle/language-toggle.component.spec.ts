/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageToggleComponent } from './language-toggle.component';
import { setupTestingModule } from '../../../test-setup';
import { ScopedTranslationServiceMock } from '@angular-apps/testing';
import { ScopedTranslationServiceInterface } from '@angular-apps/interfaces';

describe('LanguageToggleComponent', () => {
	let component: LanguageToggleComponent;
	let fixture: ComponentFixture<LanguageToggleComponent>;
	let mockTranslationService: ScopedTranslationServiceMock;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [LanguageToggleComponent]
		});

		fixture = TestBed.createComponent(LanguageToggleComponent);
		component = fixture.componentInstance;
		mockTranslationService = TestBed.inject(ScopedTranslationServiceInterface) as unknown as ScopedTranslationServiceMock;

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
