/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
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
			{ id: 'dashboard', label: 'Dashboard', link: '/' },
			{ id: 'settings', label: 'Settings', link: '/settings' }
		]);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems).toHaveLength(2);
		expect(menuItems[0].textContent).toContain('Dashboard');
		expect(menuItems[1].textContent).toContain('Settings');
	});

	it('should not display any menu items when none are provided', () => {
		fixture.componentRef.setInput('menuItems', []);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems).toHaveLength(0);
	});

	it('should handle null menu items gracefully', () => {
		fixture.componentRef.setInput('menuItems', null);
		fixture.detectChanges();
		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
		expect(menuItems).toHaveLength(0);
	});

	it('should show the search input when searchable is enabled', () => {
		fixture.componentRef.setInput('searchable', true);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('theme-input')).toBeTruthy();
	});

	it('should filter menu items by label', () => {
		fixture.componentRef.setInput('searchable', true);
		fixture.componentRef.setInput('menuItems', [
			{ id: 'sol', label: 'Sol' },
			{ id: 'alpha', label: 'Alpha Centauri' },
			{ id: 'beta', label: 'Beta' }
		]);

		fixture.detectChanges();

		(component as any).updateSearchTerm('alpha');

		fixture.detectChanges();

		const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');

		expect(menuItems).toHaveLength(1);
		expect(menuItems[0].textContent).toContain('Alpha Centauri');
	});

	it('should show all menu items when the search term is empty', () => {
		fixture.componentRef.setInput('menuItems', [
			{ id: 'sol', label: 'Sol' },
			{ id: 'alpha', label: 'Alpha' }
		]);

		(component as any).updateSearchTerm('');

		expect((component as any).filteredMenuItems()).toHaveLength(2);
	});

	it('should ignore non-string labels when filtering', () => {
		fixture.componentRef.setInput('menuItems', [
			{
				id: 'dynamic',
				label: signal('Dynamic')
			},
			{
				id: 'sol',
				label: 'Sol'
			}
		]);

		(component as any).updateSearchTerm('sol');

		expect((component as any).filteredMenuItems()).toEqual([
			{
				id: 'sol',
				label: 'Sol'
			}
		]);
	});
});
