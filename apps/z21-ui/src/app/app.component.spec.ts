/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { LocoState } from '@application-platform/protocol';
import { LanguageToggleComponent } from '@application-platform/shared/ui-theme';
import { MockedLanguageToggleComponent } from '@application-platform/testing';
import { TurnoutState } from '@application-platform/z21-shared';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../test-setup';

import { AppComponent } from './app.component';
import { WsClientService } from './ws-client.service';

describe('AppComponent', () => {
	let fixture: ComponentFixture<AppComponent>;
	let mockWs: any;

	beforeEach(async () => {
		// create a controllable mock for the WsClientService so tests don't attempt real network
		const sendWrapper = vi.fn();
		mockWs = {
			// simple onMessage registration that captures handler
			onMessage: (h: any) => {
				mockWs._handler = h;
				return () => {
					mockWs._handler = undefined;
				};
			},
			// send only forwards to wrapper when marked open
			_isOpen: false,
			open: () => (mockWs._isOpen = true),
			close: () => (mockWs._isOpen = false),
			send: (msg: any) => {
				if (mockWs._isOpen) sendWrapper(JSON.stringify(msg));
			},
			_requestCalls: [] as any[],
			request: (builder: any, opts?: any) => {
				// minimal request shim: build a fake requestId and return a promise that can be resolved
				const reqId = 'test-req';
				const msg = builder(reqId);
				mockWs._requestCalls.push({ msg, opts });
				return Promise.reject(new Error('not implemented in mock'));
			}
		};

		// Provide mocked services to the testing module
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
				{ provide: LanguageToggleComponent, useClass: MockedLanguageToggleComponent },
				{ provide: WsClientService, useValue: mockWs }
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

		// mark mock ws as open so its send forwards to the wrapper
		mockWs.open();

		// replace internal send wrapper spy reference for assertion
		const sendSpy = vi.fn();
		// override internal wrapper (we cannot reach closure created in beforeEach), so recreate mockWs.send
		mockWs.send = (msg: any) => {
			if (mockWs._isOpen) sendSpy(JSON.stringify(msg));
		};

		// set a sensible selected address in the store
		comp.store.selectedAddr.set(42);

		// setSpeed now expects a 0..1 UI value
		comp.setSpeed(0.55);

		expect(comp.store.speedUi()).toBeCloseTo(0.55);
		expect(sendSpy).toHaveBeenCalledTimes(1);
		const send = JSON.parse(sendSpy.mock.calls[0][0]);
		expect(send.type).toBe('loco.command.drive');
		expect(send.payload.addr).toBe(comp.store.selectedAddr());
		// speed should be 0..126 rounded
		expect(send.payload.speed).toBe(Math.round(0.55 * 126));
		expect(send.payload.dir).toBe(comp.store.dir());
	});

	it('should not send messages when websocket is not open', () => {
		const comp = fixture.componentInstance;

		// ensure mock ws is closed
		mockWs.close();

		const sendSpy = vi.fn();
		mockWs.send = (msg: any) => {
			if (mockWs._isOpen) sendSpy(JSON.stringify(msg));
		};

		comp.setSpeed(0.1);
		expect(comp.store.speedUi()).toBeCloseTo(0.1);
		expect(sendSpy).not.toHaveBeenCalled();
	});

	it('should send function set command with correct payload', () => {
		const comp = fixture.componentInstance;
		mockWs.open();
		const sendSpy = vi.fn();
		mockWs.send = (msg: any) => {
			if (mockWs._isOpen) sendSpy(JSON.stringify(msg));
		};

		comp.store.selectedAddr.set(7);
		comp.sendFn(2, true);

		expect(sendSpy).toHaveBeenCalledTimes(1);
		const send = JSON.parse(sendSpy.mock.calls[0][0]);
		expect(send.type).toBe('loco.command.function.set');
		expect(send.payload.fn).toBe(2);
		expect(send.payload.on).toBe(true);
		expect(send.payload.addr).toBe(comp.store.selectedAddr());
	});

	it('should send turnout command including pulseMs', () => {
		const comp = fixture.componentInstance;
		mockWs.open();
		const sendSpy = vi.fn();
		mockWs.send = (msg: any) => {
			if (mockWs._isOpen) sendSpy(JSON.stringify(msg));
		};

		comp.store.turnoutAddr.set(123);
		comp.sendTurnout(TurnoutState.DIVERGING);

		expect(sendSpy).toHaveBeenCalledTimes(1);
		const send = JSON.parse(sendSpy.mock.calls[0][0]);
		expect(send.type).toBe('switching.command.turnout.set');
		expect(send.payload.state).toBe(TurnoutState.DIVERGING);
		expect(send.payload.pulseMs).toBe(200);
		expect(send.payload.addr).toBe(comp.store.turnoutAddr());
	});

	it('should register ws onMessage handler and update store when a server message is received', () => {
		// Setup a fresh component that received the mockWs via DI in beforeEach
		const comp = fixture.componentInstance;

		// ensure mockWs captured a handler during component construction
		expect(typeof mockWs._handler === 'function').toBe(true);

		// set selected address so updateFromServer will match
		comp.store.selectedAddr.set(5);
		comp.store.draggingSpeed.set(false);

		// simulate server message via the registered handler
		const serverMsg = {
			type: 'loco.message.state',
			payload: { addr: 5, speed: 63, dir: 'REV', fns: { 1: true }, estop: false }
		} as LocoState;
		mockWs._handler(serverMsg);

		// store should have been updated by the registered handler
		expect(comp.store.speedUi()).toBeCloseTo(63 / 126);
		expect(comp.store.dir()).toBe('REV');
		expect(comp.store.functions()[1]).toBe(true);
	});

	it('should toggle power and send commands when websocket is open', () => {
		const comp = fixture.componentInstance;
		mockWs.open();
		const sendSpy = vi.fn();
		mockWs.send = (msg: any) => {
			if (mockWs._isOpen) sendSpy(JSON.stringify(msg));
		};

		comp.store.powerOn.set(true);
		comp.togglePower();
		expect(comp.store.powerOn()).toBe(false);
		let send = JSON.parse(sendSpy.mock.calls[0][0]);
		expect(send.type).toBe('system.command.trackpower.set');
		expect(send.payload.powerOn).toBe(false);

		comp.togglePower();
		expect(comp.store.powerOn()).toBe(true);
		send = JSON.parse(sendSpy.mock.calls[1][0]);
		expect(send.payload.powerOn).toBe(true);
	});

	it('updateFromServer handles loco.message.state updating when addr matches and draggingSpeed false', () => {
		const comp = fixture.componentInstance;
		// prepare state
		comp.store.selectedAddr.set(5);
		comp.store.draggingSpeed.set(false);

		// message matching address
		comp.store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: 5, speed: 63, dir: 'REV', fns: { 1: true }, estop: false }
		} as LocoState);
		expect(comp.store.speedUi()).toBeCloseTo(63 / 126);
		expect(comp.store.dir()).toBe('REV');
		expect(comp.store.functions()[1]).toBe(true);
	});

	it('updateFromServer does not update speed when draggingSpeed is true', () => {
		const comp = fixture.componentInstance;
		comp.store.selectedAddr.set(9);
		comp.store.draggingSpeed.set(true);
		comp.store.speedUi.set(0.2);

		comp.store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: 9, speed: 10, dir: 'FWD', fns: {}, estop: false }
		} as LocoState);
		expect(comp.store.speedUi()).toBeCloseTo(0.2);
	});

	it('readCv sets cvValue on success and clears cvError', async () => {
		const comp = fixture.componentInstance;
		mockWs.request = vi.fn().mockResolvedValue({
			type: 'programming.replay.cv.result',
			payload: { cvValue: 7 }
		});

		await comp.readCv();

		expect(comp.cvError()).toBeNull();
		expect(comp.cvValue()).toBe(7);
		expect(mockWs.request).toHaveBeenCalledTimes(1);
	});

	it('readCv sets cvError on failure and clears cvValue', async () => {
		const comp = fixture.componentInstance;
		mockWs.request = vi.fn().mockRejectedValue(new Error('boom'));

		await comp.readCv();

		expect(comp.cvValue()).toBeNull();
		expect(comp.cvError()).toBe('boom');
	});

	it('writeCv guards against null cvValue', async () => {
		const comp = fixture.componentInstance;
		mockWs.request = vi.fn();
		comp.cvValue.set(null);

		await comp.writeCv();

		expect(comp.cvError()).toBe('cvValue is null');
		expect(mockWs.request).not.toHaveBeenCalled();
	});

	it('writeCv clears cvError on success and reports errors on failure', async () => {
		const comp = fixture.componentInstance;

		comp.cvValue.set(12);
		mockWs.request = vi.fn().mockResolvedValue({
			type: 'programming.replay.cv.result',
			payload: { cvValue: 12 }
		});
		await comp.writeCv();
		expect(comp.cvError()).toBeNull();

		mockWs.request = vi.fn().mockRejectedValue(new Error('nope'));
		await comp.writeCv();
		expect(comp.cvError()).toBe('nope');
	});

	it('sendEStop emits a loco.command.eStop message', () => {
		const comp = fixture.componentInstance;
		mockWs.open();
		const sendSpy = vi.fn();
		mockWs.send = (msg: any) => {
			if (mockWs._isOpen) sendSpy(JSON.stringify(msg));
		};

		comp.store.selectedAddr.set(99);
		comp.sendEStop();

		expect(sendSpy).toHaveBeenCalledTimes(1);
		const send = JSON.parse(sendSpy.mock.calls[0][0]);
		expect(send.type).toBe('loco.command.eStop');
		expect(send.payload.addr).toBe(99);
	});

	it('setLocoNumber and draggingSpeed update store signals', () => {
		const comp = fixture.componentInstance;

		comp.setLocoNumber(123);
		expect(comp.store.selectedAddr()).toBe(123);

		comp.draggingSpeed(true);
		expect(comp.store.draggingSpeed()).toBe(true);
	});

	it('numericKeySort orders numeric keys and prefers non-numeric before numeric', () => {
		const comp = fixture.componentInstance as any;
		const sort = comp.numericKeySort as (a: { key: string }, b: { key: string }) => number;

		expect(sort({ key: 'a' }, { key: 'b' })).toBe(0);
		expect(sort({ key: 'a' }, { key: '2' })).toBeLessThan(0);
		expect(sort({ key: '2' }, { key: 'a' })).toBeGreaterThan(0);
		expect(sort({ key: '2' }, { key: '10' })).toBeLessThan(0);
	});
});
