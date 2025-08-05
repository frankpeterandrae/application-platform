/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HeroComponent } from './hero.component';
import { setupTestingModule } from '../../../test-setup';

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

	it('should set the translated paragraph text on initialization', fakeAsync(() => {
		fixture.detectChanges();
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		expect(component.paragraph()).toBe('feature.HeroComponent.lbl.Paragraph1');
	}));
});
