/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ClientToServer } from '@application-platform/protocol';
import { vi, type Mock } from 'vitest';

import { ClientMessageHandler, type BroadcastFn } from './client-message-handler';

describe('ClientMessageHandler.handle', () => {
	let broadcast: vi.MockedFunction<BroadcastFn>;
	let locoManager: {
		setSpeed: Mock;
		setFunction: Mock;
	};
	let z21Service: {
		sendTrackPower: Mock;
		demoPing: Mock;
	};
	let handler: ClientMessageHandler;

	beforeEach(() => {
		broadcast = vi.fn();
		locoManager = {
			setSpeed: vi.fn().mockReturnValue({ speed: 0, dir: 'FWD', fns: {} }),
			setFunction: vi.fn().mockReturnValue({ speed: 10, dir: 'REV', fns: { 0: true } })
		} as any;
		z21Service = {
			sendTrackPower: vi.fn(),
			demoPing: vi.fn()
		} as any;
		handler = new ClientMessageHandler(locoManager as any, z21Service as any, broadcast);
	});

	it('ignores server.command.session.hello messages', () => {
		handler.handle({ type: 'server.command.session.hello' } as ClientToServer);
		expect(broadcast).not.toHaveBeenCalled();
		expect(z21Service.sendTrackPower).not.toHaveBeenCalled();
		expect(z21Service.demoPing).not.toHaveBeenCalled();
	});

	it('handles system.command.trackpower.set by sending power command and broadcasting power state', () => {
		handler.handle({ type: 'system.command.trackpower.set', on: true } as ClientToServer);
		expect(z21Service.sendTrackPower).toHaveBeenCalledWith(true);
		expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: true, short: false });
	});

	it('sets locomotive speed and broadcasts updated state on loco.command.drive', () => {
		locoManager.setSpeed.mockReturnValue({ speed: 42, dir: 'REV', fns: { 1: true } });
		handler.handle({ type: 'loco.command.drive', addr: 5, speed: 42, dir: 'REV' } as unknown as ClientToServer);
		expect(locoManager.setSpeed).toHaveBeenCalledWith(5, 42, 'REV');
		expect(z21Service.demoPing).toHaveBeenCalled();
		expect(broadcast).toHaveBeenCalledWith({ type: 'loco.message.state', addr: 5, speed: 42, dir: 'REV', fns: { 1: true } });
	});

	it('toggles a loco function and broadcasts updated state on loco.command.function.set', () => {
		locoManager.setFunction.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: false } });
		handler.handle({ type: 'loco.command.function.set', addr: 7, fn: 2, on: false } as ClientToServer);
		expect(locoManager.setFunction).toHaveBeenCalledWith(7, 2, false);
		expect(z21Service.demoPing).toHaveBeenCalled();
		expect(broadcast).toHaveBeenCalledWith({ type: 'loco.message.state', addr: 7, speed: 13, dir: 'FWD', fns: { 0: true, 2: false } });
	});

	it('updates turnout state and broadcasts on turnout.set', () => {
		handler.handle({ type: 'switching.command.turnout.set', addr: 9, state: 'DIVERGING' } as unknown as ClientToServer);
		expect(z21Service.demoPing).toHaveBeenCalled();
		expect(broadcast).toHaveBeenCalledWith({ type: 'switching.message.turnout.state', addr: 9, state: 'DIVERGING' });
	});

	it('does nothing for unsupported message types', () => {
		handler.handle({ type: 'ds.unknown' } as any);
		expect(broadcast).not.toHaveBeenCalled();
		expect(z21Service.sendTrackPower).not.toHaveBeenCalled();
		expect(z21Service.demoPing).not.toHaveBeenCalled();
	});
});
