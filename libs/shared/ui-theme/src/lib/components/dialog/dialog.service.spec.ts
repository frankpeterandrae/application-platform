/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
import type { OverlayRef } from '@angular/cdk/overlay';
import { Overlay } from '@angular/cdk/overlay';
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import type { DialogConfigModel } from '../../model/dialog-config.model';

import { DialogService } from './dialog-service';

// Local helper types for clearer, typed mocks in tests
type MockOverlayRef = Partial<OverlayRef> & {
	attach: (...args: any[]) => any;
	backdropClick: (...args: any[]) => any;
	dispose: (...args: any[]) => any;
};

type ComponentType = new (...args: any[]) => any;

describe('DialogService', () => {
	let service: DialogService;
	let overlay: Overlay;
	let createSpy: ReturnType<typeof vi.spyOn>;
	let attachSpy: ReturnType<typeof vi.spyOn>;
	let backdropClickSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Create the mock overlay ref first so we can provide an Overlay that returns it
		const mockOverlayRef: Partial<OverlayRef> = {
			attach: vi.fn(),
			backdropClick: vi.fn().mockReturnValue(of(void 0)),
			dispose: vi.fn()
		};

		// Minimal mock for position() chain used in DialogService
		const mockPositionStrategy = {
			global: () => ({ centerHorizontally: () => ({ centerVertically: () => ({}) }) })
		};

		const mockOverlay = {
			create: vi.fn().mockReturnValue(mockOverlayRef as OverlayRef),
			position: vi.fn().mockReturnValue(mockPositionStrategy)
		};

		// Provide a mocked Overlay where create() returns our mockOverlayRef
		TestBed.configureTestingModule({
			providers: [DialogService, { provide: Overlay, useValue: mockOverlay }, Injector]
		});

		service = TestBed.inject(DialogService);
		overlay = TestBed.inject(Overlay);

		createSpy = vi.spyOn(overlay, 'create');
		attachSpy = vi.spyOn(mockOverlayRef as MockOverlayRef, 'attach');
		backdropClickSpy = vi.spyOn(mockOverlayRef as MockOverlayRef, 'backdropClick');
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should open a dialog and attach the component to the overlay', () => {
		const mockComponent: ComponentType = class {} as unknown as ComponentType; // simple dummy component constructor
		const mockData: DialogConfigModel<any> = { settings: undefined, componentData: 'test data' };

		const overlayRef = service.open(mockComponent, mockData);

		// Verify that Overlay.create was called with the correct config
		expect(createSpy).toHaveBeenCalled();
		expect(overlayRef).toBeTruthy();

		// Verify that the component was attached to the overlay
		expect(attachSpy).toHaveBeenCalled();

		// Verify that backdropClick was subscribed to
		expect(backdropClickSpy).toHaveBeenCalled();
	});
});
