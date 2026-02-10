/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { DropdownDemoComponent } from './dropdown-demo.component';

describe('DropdownDemoComponent', () => {
	let component: DropdownDemoComponent;
	let fixture: ComponentFixture<DropdownDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [DropdownDemoComponent]
		});

		fixture = TestBed.createComponent(DropdownDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have description defined', () => {
		expect(component.description).toBeDefined();
		expect(component.description.title).toBeDefined();
	});

	it('should have options signal defined', () => {
		expect(component.options).toBeDefined();
		expect(component.options().length).toBe(4);
	});

	it('should have iconOptions signal defined', () => {
		expect(component.iconOptions).toBeDefined();
		expect(component.iconOptions().length).toBe(4);
	});

	it('should have selectedValue signal initialized to null', () => {
		expect(component.selectedValue()).toBeNull();
	});

	it('should have selectedIcon signal initialized to null', () => {
		expect(component.selectedIcon()).toBeNull();
	});

	it('should update selectedValue when set', () => {
		const option = component.options()[0];
		component.selectedValue.set(option.value);
		expect(component.selectedValue()).toEqual(option.value);
	});

	it('should update selectedIcon when set', () => {
		const option = component.iconOptions()[0];
		component.selectedIcon.set(option.value);
		expect(component.selectedIcon()).toEqual(option.value);
	});
});
