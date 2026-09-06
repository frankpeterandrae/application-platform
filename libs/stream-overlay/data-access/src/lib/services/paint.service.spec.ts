/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Paint } from '@application-platform/paint';
import { PaintEvent } from '@application-platform/paint-protocol';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { PaintService } from './paint.service';
import { WebSocketService } from './websocket.service';

describe('PaintService', () => {
	let service: PaintService;

	let paintChanged: Subject<Paint | undefined>;

	const webSocketService = {
		on: vi.fn(),
		send: vi.fn(),
		sendWhenConnected: vi.fn()
	};

	const paint: Paint = {
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		mainColor: '#991115',
		colorGroups: ['red']
	};

	beforeEach(async () => {
		paintChanged = new Subject<Paint | undefined>();
		vi.clearAllMocks();

		webSocketService.on.mockReturnValue(paintChanged.asObservable());

		await setupTestingModule({
			providers: [
				PaintService,
				{
					provide: WebSocketService,
					useValue: webSocketService
				}
			]
		});

		service = TestBed.inject(PaintService);
	});

	it('should start without a current paint', () => {
		expect(service.currentPaint()).toBeUndefined();
	});

	it('should subscribe to paint changed events', () => {
		expect(webSocketService.on).toHaveBeenCalledWith(PaintEvent.Changed);
	});

	it('should request the current paint on creation', () => {
		expect(webSocketService.sendWhenConnected).toHaveBeenCalledWith(PaintEvent.GetCurrent, undefined);
	});

	it('should update currentPaint when a paint changed event is received', () => {
		paintChanged.next(paint);

		expect(service.currentPaint()).toEqual(paint);
	});

	it('should update currentPaint for subsequent paint changes', () => {
		const secondPaint: Paint = {
			...paint,
			id: 'citadel:22-01',
			sku: '22-01',
			name: 'Khorne Red',
			mainColor: '#650001'
		};

		paintChanged.next(paint);

		expect(service.currentPaint()).toEqual(paint);

		paintChanged.next(secondPaint);

		expect(service.currentPaint()).toEqual(secondPaint);
	});

	it('should send selected paint to the websocket', () => {
		service.selectPaint(paint);

		expect(webSocketService.send).toHaveBeenCalledWith(PaintEvent.Select, paint);
	});

	it('should clear currentPaint when an undefined paint changed event is received', () => {
		paintChanged.next(paint);

		expect(service.currentPaint()).toEqual(paint);

		paintChanged.next(undefined);

		expect(service.currentPaint()).toBeUndefined();
	});

	it('should clear the current paint and notify the websocket', () => {
		paintChanged.next(paint);

		service.clearPaint();

		expect(webSocketService.send).toHaveBeenCalledWith(PaintEvent.Clear, undefined);
		expect(service.currentPaint()).toBeUndefined();
	});
});
