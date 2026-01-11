/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { setupTestingModule } from '../../../../test-setup';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
	let component: SidebarComponent;
	let fixture: ComponentFixture<SidebarComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [SidebarComponent],
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

		fixture = TestBed.createComponent(SidebarComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('menuItems', []);
		fixture.detectChanges();
	});

	it('should create', () => {
		fixture.componentRef.setInput('menuItems', []);
		expect(component).toBeTruthy();
	});

	it('should render the sidebar component', () => {
		const sidebarElement = fixture.nativeElement.querySelector('nav');
		expect(sidebarElement).toBeTruthy();
	});

	it('should display menu items when provided', () => {
		fixture.componentRef.setInput('menuItems', [
			{ label: 'Dashboard', link: '/' },
			{ label: 'Settings', link: '/settings' }
		]);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems.length).toBe(2);
		expect(menuItems[0].textContent).toContain('Dashboard');
		expect(menuItems[1].textContent).toContain('Settings');
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
