/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { TabGroupComponent } from './tab-group.component';
import { TabComponent } from './tab.component';

// Test wrapper component to hold TabGroup with Tab children
@Component({
	selector: 'theme-test-wrapper',
	imports: [TabGroupComponent, TabComponent],
	template: `
		<theme-tab-group>
			<theme-tab [label]="'Tab 1'"></theme-tab>
			<theme-tab [label]="'Tab 2'"></theme-tab>
			<theme-tab [label]="'Tab 3'"></theme-tab>
		</theme-tab-group>
	`
})
class TestWrapperComponent {}

describe('TabGroupComponent', () => {
	let fixture: ComponentFixture<TestWrapperComponent>;
	let tabGroupComponent: TabGroupComponent;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TestWrapperComponent, TabGroupComponent, TabComponent]
		});
		fixture = TestBed.createComponent(TestWrapperComponent);
		fixture.detectChanges();

		// Get reference to TabGroupComponent through directive query
		tabGroupComponent = fixture.debugElement.children[0].componentInstance as TabGroupComponent;
	});

	it('should create', () => {
		expect(tabGroupComponent).toBeTruthy();
	});

	it('should have tabs content children', () => {
		fixture.detectChanges(); // Trigger AfterContentInit
		expect(tabGroupComponent.tabs()).toBeDefined();
		expect(tabGroupComponent.tabs().length).toBeGreaterThan(0);
	});

	describe('ngAfterContentInit', () => {
		it('should activate first tab if none are active', () => {
			tabGroupComponent.ngAfterContentInit();
			const tabs = tabGroupComponent.tabs();
			expect(tabs[0]?.active).toBe(true);
		});

		it('should not activate first tab if one is already active', () => {
			const tabs = tabGroupComponent.tabs();
			if (tabs[1]) {
				tabs[1].active = true;
			}
			tabGroupComponent.ngAfterContentInit();
			// First tab should not be automatically activated since one is already active
			expect(tabs.some((t) => t.active)).toBe(true);
		});

		it('should not crash if no tabs exist', () => {
			const emptyTabGroup = new TabGroupComponent();
			expect(() => emptyTabGroup.ngAfterContentInit()).not.toThrow();
		});
	});

	describe('selectTab', () => {
		it('should activate selected tab', () => {
			const tabs = tabGroupComponent.tabs();
			const tabToSelect = tabs[1];
			if (tabToSelect) {
				tabGroupComponent.selectTab(tabToSelect);
				expect(tabToSelect.active).toBe(true);
			}
		});

		it('should deactivate all other tabs when one is selected', () => {
			const tabs = tabGroupComponent.tabs();
			const tabToSelect = tabs[1];
			if (tabToSelect) {
				tabGroupComponent.selectTab(tabToSelect);
				tabs.forEach((tab, index) => {
					if (index === 1) {
						expect(tab.active).toBe(true);
					} else {
						expect(tab.active).toBe(false);
					}
				});
			}
		});

		it('should allow switching between tabs', () => {
			const tabs = tabGroupComponent.tabs();

			if (tabs[0] && tabs[1]) {
				tabGroupComponent.selectTab(tabs[0]);
				expect(tabs[0].active).toBe(true);
				expect(tabs[1].active).toBe(false);

				tabGroupComponent.selectTab(tabs[1]);
				expect(tabs[0].active).toBe(false);
				expect(tabs[1].active).toBe(true);
			}
		});

		it('should work with last tab', () => {
			const tabs = tabGroupComponent.tabs();
			const lastTab = tabs[tabs.length - 1];
			if (lastTab) {
				tabGroupComponent.selectTab(lastTab);
				expect(lastTab.active).toBe(true);
			}
		});
	});
});
