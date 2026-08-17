/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StreamEvent, StreamState } from '@application-platform/interfaces';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { StreamStateService } from './stream-state.service';
import { WebSocketService } from './websocket.service';

describe('StreamStateService', () => {
	let service: StreamStateService;
	let stateChanged: Subject<StreamState>;

	const webSocketService = {
		on: vi.fn(),
		send: vi.fn(),
		sendWhenConnected: vi.fn()
	};

	beforeEach(async () => {
		stateChanged = new Subject<StreamState>();

		vi.clearAllMocks();

		webSocketService.on.mockReturnValue(stateChanged.asObservable());

		await setupTestingModule({
			providers: [
				StreamStateService,
				{
					provide: WebSocketService,
					useValue: webSocketService
				}
			]
		});

		service = TestBed.inject(StreamStateService);
	});

	it('should initially have no title or subtitle', () => {
		expect(service.title()).toBeUndefined();
		expect(service.subtitle()).toBeUndefined();
	});

	it('should subscribe to stream state changes', () => {
		expect(webSocketService.on).toHaveBeenCalledWith(StreamEvent.StateChanged);
	});

	it('should request the current stream state on creation', () => {
		expect(webSocketService.sendWhenConnected).toHaveBeenCalledWith(StreamEvent.GetState, undefined);
	});

	it('should update signals when a state changed event is received', () => {
		stateChanged.next({
			title: 'Miniaturen bemalen',
			subtitle: 'Sky Lantern'
		});

		expect(service.title()).toBe('Miniaturen bemalen');
		expect(service.subtitle()).toBe('Sky Lantern');
	});

	it('should update the title locally and send the change', () => {
		service.updateState({ title: 'Blood Angels' });

		expect(service.title()).toBe('Blood Angels');

		expect(webSocketService.send).toHaveBeenCalledWith(StreamEvent.UpdateState, {
			title: 'Blood Angels'
		});
	});

	it('should update the subtitle locally and send the change', () => {
		service.updateState({ subtitle: 'Sanguinary Guard' });

		expect(service.subtitle()).toBe('Sanguinary Guard');

		expect(webSocketService.send).toHaveBeenCalledWith(StreamEvent.UpdateState, {
			subtitle: 'Sanguinary Guard'
		});
	});

	it('should preserve unrelated state when updating the title locally', () => {
		stateChanged.next({
			title: 'Miniaturen bemalen',
			subtitle: 'Sky Lantern'
		});

		service.updateState({ title: 'Blood Angels' });

		expect(service.title()).toBe('Blood Angels');
		expect(service.subtitle()).toBe('Sky Lantern');
	});
});
