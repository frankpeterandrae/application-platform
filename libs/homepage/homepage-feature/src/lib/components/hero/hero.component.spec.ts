/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { HeroComponent } from './hero.component';

describe('HeroComponent', () => {
	let component: HeroComponent;
	let fixture: ComponentFixture<HeroComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [HeroComponent]
		});

		fixture = TestBed.createComponent(HeroComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should set the translated paragraph text on initialization', async () => {
		fixture.detectChanges();
		// wait for translation simulation
		await new Promise((r) => setTimeout(r, 100));
		fixture.detectChanges();
		expect(component.paragraph()).toBe('homepageFeatureI18n.HeroComponent.lbl.Paragraph1');
	});
});
