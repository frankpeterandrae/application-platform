/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { LanguageToggleComponent } from '@application-platform/shared/ui-theme';
import { MockedLanguageToggleComponent } from '@application-platform/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../test-setup';

import { AppComponent } from './app.component';
describe('AppComponent', () => {
	let fixture: ComponentFixture<AppComponent>;

	beforeEach(async () => {
		// Removed overrideComponent so the real template and styles are used in tests

		await setupTestingModule({
			imports: [AppComponent],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						params: of({}),
						snapshot: {
							paramMap: {
								get: (): any => null
							}
						}
					}
				},
				{ provide: LanguageToggleComponent, useClass: MockedLanguageToggleComponent }
			]
		});

		fixture = TestBed.createComponent(AppComponent);
	});

	it('should create the app', () => {
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should set speed signal and send loco.command.drive when websocket is open', () => {
		const comp = fixture.componentInstance;

		// Ensure WebSocket.OPEN is available in the environment for the component check
		const originalWebSocket = (global as any).WebSocket;
		if (!originalWebSocket || originalWebSocket.OPEN === undefined) {
			(global as any).WebSocket = Object.assign(originalWebSocket ?? {}, { OPEN: 1 });
		}

		const mockSend = vi.fn();
		(comp as any).ws = { readyState: (global as any).WebSocket.OPEN, send: mockSend } as any;

		comp.setSpeed(55);

		expect(comp.speed()).toBe(55);
		expect(mockSend).toHaveBeenCalledTimes(1);
		const sent = JSON.parse(mockSend.mock.calls[0][0]);
		expect(sent.type).toBe('loco.command.drive');
		expect(sent.addr).toBe(comp.addr());
		expect(sent.speed).toBe(55);
		expect(sent.dir).toBe(comp.dir());

		// restore
		if (originalWebSocket !== undefined) (global as any).WebSocket = originalWebSocket;
	});

	it('should not send messages when websocket is not open', () => {
		const comp = fixture.componentInstance;
		const mockSend = vi.fn();
		(comp as any).ws = { readyState: 0, send: mockSend } as any;

		comp.setSpeed(10);
		expect(comp.speed()).toBe(10);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('should send function set command with correct payload', () => {
		const comp = fixture.componentInstance;
		const mockSend = vi.fn();
		const WS_OPEN = (global as any).WebSocket?.OPEN ?? 1;
		(comp as any).ws = { readyState: WS_OPEN, send: mockSend } as any;

		comp.sendFn(2, true);

		expect(mockSend).toHaveBeenCalledTimes(1);
		const sent = JSON.parse(mockSend.mock.calls[0][0]);
		expect(sent.type).toBe('loco.command.function.set');
		expect(sent.fn).toBe(2);
		expect(sent.on).toBe(true);
		expect(sent.addr).toBe(comp.addr());
	});

	it('should send turnout command including pulseMs', () => {
		const comp = fixture.componentInstance;
		const mockSend = vi.fn();
		const WS_OPEN = (global as any).WebSocket?.OPEN ?? 1;
		(comp as any).ws = { readyState: WS_OPEN, send: mockSend } as any;

		comp.sendTurnout('DIVERGING');

		expect(mockSend).toHaveBeenCalledTimes(1);
		const sent = JSON.parse(mockSend.mock.calls[0][0]);
		expect(sent.type).toBe('switching.command.turnout.set');
		expect(sent.state).toBe('DIVERGING');
		expect(sent.pulseMs).toBe(200);
		expect(sent.addr).toBe(comp.turnoutAddr());
	});

	it('should update lastMsg when a server message is received via websocket', () => {
		const comp = fixture.componentInstance;

		// Mock WebSocket class that captures the instance
		class MockWebSocket {
			public static lastInstance: any;
			public onopen: (() => void) | null = null;
			public onclose: (() => void) | null = null;
			public onmessage: ((ev: any) => void) | null = null;
			public readyState = 1;
			constructor() {
				(MockWebSocket as any).lastInstance = this;
			}
			public send(_d: any): void {
				// noop for test
			}
		}

		const originalWebSocket = (global as any).WebSocket;
		(global as any).WebSocket = MockWebSocket as any;

		// call private connect to create a MockWebSocket instance and wire handlers
		(comp as any).connect();
		const inst = (MockWebSocket as any).lastInstance as MockWebSocket;
		expect(inst).toBeDefined();

		// simulate open -> component should set status to connected
		if (inst.onopen) inst.onopen();
		expect(comp.status()).toBe('connected');

		// simulate server message
		const serverMsg = { type: 'some.server.msg', value: 42 };
		if (inst.onmessage) inst.onmessage({ data: JSON.stringify(serverMsg) });
		// lastMsg is pretty-printed JSON
		expect(comp.lastMsg()).toBe(JSON.stringify(serverMsg, null, 2));

		// restore
		(global as any).WebSocket = originalWebSocket;
	});
});
