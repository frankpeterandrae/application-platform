/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { DialogDemoComponent } from './dialog-demo.component';

describe('DialogDemoComponent', () => {
	let component: DialogDemoComponent;
	let fixture: ComponentFixture<DialogDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [DialogDemoComponent]
		});

		fixture = TestBed.createComponent(DialogDemoComponent);
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

	it('should call dialogService.open when openBasicDialog is called', () => {
		const spy = vi.spyOn(component['dialogService'], 'open');
		component.openBasicDialog();
		expect(spy).toHaveBeenCalled();
	});

	it('should call dialogService.open when openDialogWithContent is called', () => {
		const spy = vi.spyOn(component['dialogService'], 'open');
		component.openDialogWithContent();
		expect(spy).toHaveBeenCalled();
	});
});
