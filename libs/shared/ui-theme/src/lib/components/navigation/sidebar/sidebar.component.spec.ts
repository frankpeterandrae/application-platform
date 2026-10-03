/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';
import { InputComponent } from '../../input/input.component';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
	let component: SidebarComponent;
	let fixture: ComponentFixture<SidebarComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [SidebarComponent],
			providers: [provideRouter([])]
		});

		fixture = TestBed.createComponent(SidebarComponent);
		component = fixture.componentInstance;

		fixture.componentRef.setInput('menuItems', []);
	});

	it('should render configured menu items', () => {
		fixture.componentRef.setInput('menuItems', [
			{ id: 'dashboard', label: 'Dashboard', route: '/dashboard' },
			{ id: 'settings', label: 'Settings', route: '/settings' }
		]);

		fixture.detectChanges();

		const items = fixture.nativeElement.querySelectorAll('.menu-item');

		expect(items).toHaveLength(2);
		expect(items[0].textContent).toContain('Dashboard');
		expect(items[1].textContent).toContain('Settings');
	});

	it('should render routed items as links', () => {
		fixture.componentRef.setInput('menuItems', [{ id: 'dashboard', label: 'Dashboard', route: '/dashboard' }]);

		fixture.detectChanges();

		const link = fixture.nativeElement.querySelector('a');

		expect(link).not.toBeNull();
		expect(link.textContent).toContain('Dashboard');
	});

	it('should render action items as buttons', () => {
		fixture.componentRef.setInput('menuItems', [{ id: 'action', label: 'Action' }]);

		fixture.detectChanges();

		const button = fixture.nativeElement.querySelector('button.menu-action');

		expect(button).not.toBeNull();
		expect(button.textContent).toContain('Action');
	});

	it('should emit the selected action item', () => {
		const item = {
			id: 'action',
			label: 'Action'
		};
		const emitSpy = vi.spyOn(component.menuItemSelected, 'emit');

		fixture.componentRef.setInput('menuItems', [item]);
		fixture.detectChanges();

		const button = fixture.nativeElement.querySelector('button.menu-action') as HTMLButtonElement;

		button.click();

		expect(emitSpy).toHaveBeenCalledWith(item);
	});

	it('should show the search input only when searchable is enabled', () => {
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('theme-input')).toBeNull();

		fixture.componentRef.setInput('searchable', true);
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('theme-input')).not.toBeNull();
	});

	it('should filter menu items case-insensitively', () => {
		fixture.componentRef.setInput('searchable', true);
		fixture.componentRef.setInput('menuItems', [
			{ id: 'sol', label: 'Sol' },
			{ id: 'alpha', label: 'Alpha Centauri' },
			{ id: 'beta', label: 'Beta' }
		]);

		fixture.detectChanges();

		const searchInput = fixture.debugElement.query(By.directive(InputComponent)).componentInstance as InputComponent;

		searchInput.valueChange.emit('ALPHA');
		fixture.detectChanges();

		const items = fixture.nativeElement.querySelectorAll('.menu-item');

		expect(items).toHaveLength(1);
		expect(items[0].textContent).toContain('Alpha Centauri');
	});

	it('should show all menu items when the search term is cleared', () => {
		fixture.componentRef.setInput('searchable', true);
		fixture.componentRef.setInput('menuItems', [
			{ id: 'sol', label: 'Sol' },
			{ id: 'alpha', label: 'Alpha' }
		]);

		fixture.detectChanges();

		const searchInput = fixture.debugElement.query(By.directive(InputComponent)).componentInstance as InputComponent;

		searchInput.valueChange.emit('sol');
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelectorAll('.menu-item')).toHaveLength(1);

		searchInput.valueChange.emit('');
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelectorAll('.menu-item')).toHaveLength(2);
	});

	it('should ignore signal labels while filtering', () => {
		fixture.componentRef.setInput('searchable', true);
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

		fixture.detectChanges();

		const searchInput = fixture.debugElement.query(By.directive(InputComponent)).componentInstance as InputComponent;

		searchInput.valueChange.emit('sol');
		fixture.detectChanges();

		const items = fixture.nativeElement.querySelectorAll('.menu-item');

		expect(items).toHaveLength(1);
		expect(items[0].textContent).toContain('Sol');
	});
});
