/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
	let component: HeaderComponent;
	let fixture: ComponentFixture<HeaderComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [HeaderComponent]
		});

		fixture = TestBed.createComponent(HeaderComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('menuItems', []);
		fixture.detectChanges();
	});

	it('should create', () => {
		fixture.componentRef.setInput('menuItems', []);
		expect(component).toBeTruthy();
	});

	it('should render the top navbar component', () => {
		const topNavbarElement = fixture.nativeElement.querySelector('theme-topnavbar');
		expect(topNavbarElement).toBeTruthy();
	});

	it('should not display any menu items when none are provided', () => {
		fixture.componentRef.setInput('menuItems', []);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems.length).toBe(0);
	});

	it('should handle null menu items gracefully', () => {
		fixture.componentRef.setInput('menuItems', null);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems.length).toBe(0);
	});
});
