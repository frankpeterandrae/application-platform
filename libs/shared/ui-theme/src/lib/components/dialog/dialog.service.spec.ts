/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
import type { OverlayRef } from '@angular/cdk/overlay';
import { Overlay } from '@angular/cdk/overlay';
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import type { DialogConfigModel } from '../../model/dialog-config.model';

import { DialogService } from './dialog-service';

describe('DialogService', () => {
	let service: DialogService;
	let overlay: Overlay;
	let createSpy: jest.SpyInstance;
	let attachSpy: jest.SpyInstance;
	let backdropClickSpy: jest.SpyInstance;

	beforeEach(() => {
		// Create the mock overlay ref first so we can provide an Overlay that returns it
		const mockOverlayRef: Partial<OverlayRef> = {
			attach: jest.fn(),
			backdropClick: jest.fn().mockReturnValue(of(void 0)),
			dispose: jest.fn()
		};

		// Minimal mock for position() chain used in DialogService
		const mockPositionStrategy = {
			global: () => ({ centerHorizontally: () => ({ centerVertically: () => ({}) }) })
		};

		const mockOverlay = {
			create: jest.fn().mockReturnValue(mockOverlayRef as OverlayRef),
			position: jest.fn().mockReturnValue(mockPositionStrategy)
		};

		// Provide a mocked Overlay where create() returns our mockOverlayRef
		TestBed.configureTestingModule({
			providers: [DialogService, { provide: Overlay, useValue: mockOverlay }, Injector]
		});

		service = TestBed.inject(DialogService);
		overlay = TestBed.inject(Overlay);

		createSpy = jest.spyOn(overlay, 'create');
		attachSpy = jest.spyOn(mockOverlayRef, 'attach' as any);
		backdropClickSpy = jest.spyOn(mockOverlayRef, 'backdropClick' as any);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should open a dialog and attach the component to the overlay', () => {
		const mockComponent = jest.fn(); // Mock component
		const mockData: DialogConfigModel<any> = { settings: undefined, componentData: 'test data' };

		const overlayRef = service.open(mockComponent as any, mockData);

		// Verify that Overlay.create was called with the correct config
		expect(createSpy).toHaveBeenCalled();
		expect(overlayRef).toBeTruthy();

		// Verify that the component was attached to the overlay
		expect(attachSpy).toHaveBeenCalled();

		// Verify that backdropClick was subscribed to
		expect(backdropClickSpy).toHaveBeenCalled();
	});
});
