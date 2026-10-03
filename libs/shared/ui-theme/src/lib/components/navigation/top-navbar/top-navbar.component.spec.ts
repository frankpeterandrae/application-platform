/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { TopNavbarComponent } from './top-navbar.component';

describe('TopNavbarComponent', () => {
	let fixture: ComponentFixture<TopNavbarComponent>;
	let router: Router;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TopNavbarComponent],
			providers: [provideRouter([])]
		});

		fixture = TestBed.createComponent(TopNavbarComponent);
		router = TestBed.inject(Router);

		fixture.componentRef.setInput('menuItems', []);
	});

	it('should render routed menu items as links', () => {
		fixture.componentRef.setInput('menuItems', [
			{
				id: 'home',
				label: 'Home',
				route: '/home'
			}
		]);

		fixture.detectChanges();

		const link = fixture.nativeElement.querySelector('a');

		expect(link).not.toBeNull();
		expect(link.textContent).toContain('Home');
	});

	it('should render items with children as dropdown buttons', () => {
		fixture.componentRef.setInput('menuItems', [
			{
				id: 'parent',
				label: 'Parent',
				route: '/parent',
				children: [
					{
						id: 'child',
						label: 'Child',
						route: '/parent/child'
					}
				]
			}
		]);

		fixture.detectChanges();

		const button = fixture.nativeElement.querySelector('button.nav-dropdown');

		expect(button).not.toBeNull();
		expect(button.textContent).toContain('Parent');
		expect(button.getAttribute('aria-expanded')).toBe('false');
	});

	it('should open and close a dropdown when the parent is clicked', () => {
		fixture.componentRef.setInput('menuItems', [
			{
				id: 'parent',
				label: 'Parent',
				route: '/parent',
				children: [
					{
						id: 'child',
						label: 'Child',
						route: '/parent/child'
					}
				]
			}
		]);

		fixture.detectChanges();

		const button = fixture.nativeElement.querySelector('button.nav-dropdown') as HTMLButtonElement;
		const dropdown = fixture.nativeElement.querySelector('.dropdown-content') as HTMLElement;

		button.click();
		fixture.detectChanges();

		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(dropdown.classList).toContain('nav-show-dropdown');

		button.click();
		fixture.detectChanges();

		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(dropdown.classList).not.toContain('nav-show-dropdown');
	});

	it('should close an open dropdown on document mousedown', () => {
		fixture.componentRef.setInput('menuItems', [
			{
				id: 'parent',
				label: 'Parent',
				route: '/parent',
				children: [
					{
						id: 'child',
						label: 'Child',
						route: '/parent/child'
					}
				]
			}
		]);

		fixture.detectChanges();

		const button = fixture.nativeElement.querySelector('button.nav-dropdown') as HTMLButtonElement;

		button.click();
		fixture.detectChanges();

		expect(button.getAttribute('aria-expanded')).toBe('true');

		document.dispatchEvent(new MouseEvent('mousedown'));
		fixture.detectChanges();

		expect(button.getAttribute('aria-expanded')).toBe('false');
	});

	it('should render an empty children array as a normal link', () => {
		fixture.componentRef.setInput('menuItems', [
			{
				id: 'page',
				label: 'Page',
				route: '/page',
				children: []
			}
		]);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('button.nav-dropdown')).toBeNull();

		expect(fixture.nativeElement.querySelector('a')).not.toBeNull();
	});

	it('should mark the exact current route as active', () => {
		vi.spyOn(router, 'url', 'get').mockReturnValue('/home');

		fixture.componentRef.setInput('menuItems', [
			{
				id: 'home',
				label: 'Home',
				route: '/home'
			}
		]);

		fixture.detectChanges();

		const link = fixture.nativeElement.querySelector('a');

		expect(link.classList).toContain('link-active');
	});

	it('should mark a parent route as active for child routes', () => {
		vi.spyOn(router, 'url', 'get').mockReturnValue('/parent/child');

		fixture.componentRef.setInput('menuItems', [
			{
				id: 'parent',
				label: 'Parent',
				route: '/parent',
				children: [
					{
						id: 'child',
						label: 'Child',
						route: '/parent/child'
					}
				]
			}
		]);

		fixture.detectChanges();

		const button = fixture.nativeElement.querySelector('button.nav-dropdown');

		expect(button.classList).toContain('link-active');
	});

	it('should toggle a dropdown with Enter', () => {
		// setup ...

		const button = fixture.nativeElement.querySelector('button.nav-dropdown') as HTMLButtonElement;

		button.dispatchEvent(
			new KeyboardEvent('keyup', {
				key: 'Enter',
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(button.getAttribute('aria-expanded')).toBe('true');
	});
});
