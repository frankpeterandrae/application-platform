/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import type { DialogConfigModel } from '../../model/dialog-config.model';

import { DIALOG_DATA } from './dialog-tokens';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
	let component: DialogComponent;
	let fixture: ComponentFixture<DialogComponent>;
	let overlayRefMock: any;

	beforeEach(async () => {
		// Import CDK Overlay tokens dynamically to avoid early static initialization of Angular
		const overlayModule = await import('@angular/cdk/overlay');
		const OverlayRef = overlayModule.OverlayRef;

		overlayRefMock = {
			dispose: vi.fn()
		} as unknown as typeof OverlayRef & { dispose?: ReturnType<typeof vi.fn> };
		const mockDialogData: DialogConfigModel<any> = {
			componentData: undefined,
			settings: { title: 'Test Dialog' }
		};

		await setupTestingModule({
			imports: [DialogComponent],
			providers: [
				{ provide: overlayModule.OverlayRef, useValue: overlayRefMock },
				{ provide: DIALOG_DATA, useValue: mockDialogData }
			]
		});

		fixture = TestBed.createComponent(DialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should close the dialog when close is called', () => {
		const overlayRefSpy = vi.spyOn(component['overlayRef'], 'dispose');
		component.close();
		expect(overlayRefSpy).toHaveBeenCalled();
	});

	it('should close the dialog when backdropClick is called', () => {
		const overlayRefSpy = vi.spyOn(component['overlayRef'], 'dispose');
		component.backdropClick();
		expect(overlayRefSpy).toHaveBeenCalled();
	});

	it('should not throw error if close is called multiple times', () => {
		const overlayRefSpy = vi.spyOn(component['overlayRef'], 'dispose');
		component.close();
		component.close();
		expect(overlayRefSpy).toHaveBeenCalledTimes(2);
	});

	it('should not throw error if backdropClick is called multiple times', () => {
		const overlayRefSpy = vi.spyOn(component['overlayRef'], 'dispose');
		component.backdropClick();
		component.backdropClick();
		expect(overlayRefSpy).toHaveBeenCalledTimes(2);
	});
});
