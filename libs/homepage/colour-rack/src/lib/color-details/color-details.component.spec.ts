/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { OverlayRef } from '@angular/cdk/overlay';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { DialogConfigModel } from '@application-platform/shared/ui-theme';
import { DIALOG_DATA } from '@application-platform/shared/ui-theme';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import type { Color } from '../models/color.model';

import { ColorDetailsComponent } from './color-details.component';

describe('ColorDetailsComponent', () => {
	let component: ColorDetailsComponent;
	let fixture: ComponentFixture<ColorDetailsComponent>;
	let overlayRefMock: OverlayRef & { dispose?: ReturnType<typeof vi.fn> };

	beforeEach(async () => {
		overlayRefMock = {
			dispose: vi.fn()
		} as unknown as OverlayRef & { dispose?: ReturnType<typeof vi.fn> };

		const mockDialogData: DialogConfigModel<any> = {
			componentData: undefined,
			settings: { title: 'Test Dialog' }
		};

		await setupTestingModule({
			imports: [ColorDetailsComponent],
			providers: [
				{ provide: OverlayRef, useValue: overlayRefMock },
				{ provide: DIALOG_DATA, useValue: mockDialogData }
			]
		});

		fixture = TestBed.createComponent(ColorDetailsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should return correct color type when valid types are provided', () => {
		component.data.componentData = { type: 'S' } as Color;
		expect(component.colorType()).toBe('Shadow');
	});

	it('should return correct color type when valid combined types are provided', () => {
		component.data.componentData = { type: 'S-ME' } as Color;
		expect(component.colorType()).toBe('Shadow-Metallic');
	});

	it('should return "Unknown" when invalid types are provided', () => {
		component.data.componentData = { type: 'Metallic' } as Color;
		expect(component.colorType()).toBe('Unknown');
	});
});
