/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { assert } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { TreeViewDemoComponent } from './tree-view-demo.component';

describe('TreeViewDemoComponent', () => {
	let fixture: ComponentFixture<TreeViewDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({ imports: [TreeViewDemoComponent] });
		fixture = TestBed.createComponent(TreeViewDemoComponent);
		fixture.detectChanges();
	});

	it('displays the selected leaf data', () => {
		const leaf = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('theme-tree-view button.theme-tree-view-leaf');
		assert(leaf);
		leaf.click();
		fixture.detectChanges();

		expect(fixture.nativeElement.textContent).toContain('"content": 42');
	});
});
