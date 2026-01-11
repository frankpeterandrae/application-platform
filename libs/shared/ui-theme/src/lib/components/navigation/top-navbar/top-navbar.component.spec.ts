/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { setupTestingModule } from '../../../../test-setup';

import { TopNavbarComponent } from './top-navbar.component';

describe('TopnavbarComponent', () => {
	let component: TopNavbarComponent;
	let fixture: ComponentFixture<TopNavbarComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TopNavbarComponent],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						params: of({}),
						snapshot: {
							paramMap: {
								/**
								 * Mocked get.
								 * @returns Null.
								 */
								get: (): any => null
							}
						}
					}
				}
			]
		});

		fixture = TestBed.createComponent(TopNavbarComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('menuItems', []);
		fixture.detectChanges();
	});

	it('should create', () => {
		fixture.componentRef.setInput('menuItems', []);
		expect(component).toBeTruthy();
	});

	it('should render the top navbar component', () => {
		const topNavbarElement = fixture.nativeElement.querySelector('nav');
		expect(topNavbarElement).toBeTruthy();
	});

	it('should not display any menu items when none are provided', () => {
		fixture.componentRef.setInput('menuItems', []);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems.length).toBe(0);
	});

	it('should toggle dropdown visibility', () => {
		const route = '/test-route';
		component.toggleNavigation(route);
		expect(component.showDropdown[route]).toBeTruthy();
		component.toggleNavigation(route);
		expect(component.showDropdown[route]).toBeFalsy();
	});

	it('should reset all dropdowns to be hidden', () => {
		component.showDropdown = { '/route1': true, '/route2': true };
		component.resetDropdowns();
		expect(Object.values(component.showDropdown).every((value) => value === false)).toBeTruthy();
	});

	it('should return the current route URL', () => {
		jest.spyOn(component.router, 'url', 'get').mockReturnValue('/current-route');
		expect(component.getCurrentRoute()).toBe('/current-route');
	});
});
