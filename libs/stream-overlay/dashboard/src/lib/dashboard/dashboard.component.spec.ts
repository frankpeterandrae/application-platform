/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WebSocketService } from '@application-platform/stream-overlay-data-access';

import { setupTestingModule } from '../../test-setup';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
	const connected = signal(false);

	beforeEach(async () => {
		await setupTestingModule({
			imports: [DashboardComponent],
			providers: [
				provideRouter([]),
				{
					provide: WebSocketService,
					useValue: {
						connected
					}
				}
			]
		});
	});

	it('should create', () => {
		const fixture = TestBed.createComponent(DashboardComponent);

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should expose websocket connection state', () => {
		const fixture = TestBed.createComponent(DashboardComponent);

		const component = fixture.componentInstance as any;

		expect(component.connected()).toBe(false);

		connected.set(true);

		expect(component.connected()).toBe(true);
	});
});
