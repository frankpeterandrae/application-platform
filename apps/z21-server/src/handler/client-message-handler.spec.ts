/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ClientToServer } from '@application-platform/protocol';
import { LocoFunctionSwitchType } from '@application-platform/z21';
import { TurnoutState } from '@application-platform/z21-shared';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { ClientMessageHandler, type BroadcastFn } from './client-message-handler';

describe('ClientMessageHandler.handle', () => {
	let broadcast: MockedFunction<BroadcastFn>;
	let locoManager: {
		setSpeed: Mock;
		setFunction: Mock;
		getState: Mock;
	};
	let z21Service: {
		sendTrackPower: Mock;
		demoPing: Mock;
		setLocoDrive: Mock;
		setLocoFunction: Mock;
		setTurnout: Mock;
		getTurnoutInfo: Mock;
		setLocoEStop: Mock;
		getLocoInfo: Mock;
		setStop: Mock;
	};
	let handler: ClientMessageHandler;

	beforeEach(() => {
		broadcast = vi.fn();
		locoManager = {
			setSpeed: vi.fn().mockReturnValue({ speed: 0, dir: 'FWD', fns: {} }),
			setFunction: vi.fn().mockReturnValue({ speed: 10, dir: 'REV', fns: { 0: true } }),
			getState: vi.fn().mockReturnValue({ fns: { 1: true } })
		} as any;
		z21Service = {
			sendTrackPower: vi.fn(),
			demoPing: vi.fn(),
			setLocoDrive: vi.fn(),
			setLocoFunction: vi.fn(),
			setTurnout: vi.fn(),
			getTurnoutInfo: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
			setLocoEStop: vi.fn(),
			getLocoInfo: vi.fn(),
			setStop: vi.fn()
		} as any;
		handler = new ClientMessageHandler(locoManager as any, z21Service as any, broadcast);
	});

	describe('system.command.trackpower.set', () => {
		it('sends power ON command and broadcasts power state when on is true', () => {
			handler.handle({ type: 'system.command.trackpower.set', on: true } as ClientToServer);
			expect(z21Service.sendTrackPower).toHaveBeenCalledWith(true);
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: true, short: false });
		});

		it('sends power OFF command and broadcasts power state when on is false', () => {
			handler.handle({ type: 'system.command.trackpower.set', on: false } as ClientToServer);
			expect(z21Service.sendTrackPower).toHaveBeenCalledWith(false);
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: false, short: false });
		});

		it('calls z21Service before broadcast', () => {
			const callOrder: string[] = [];
			z21Service.sendTrackPower.mockImplementation(() => callOrder.push('z21'));
			broadcast.mockImplementation(() => callOrder.push('broadcast'));

			handler.handle({ type: 'system.command.trackpower.set', on: true } as ClientToServer);

			expect(callOrder).toEqual(['z21', 'broadcast']);
		});

		it('always sets short flag to false in broadcast', () => {
			handler.handle({ type: 'system.command.trackpower.set', on: true } as ClientToServer);
			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ short: false }));
		});
	});

	describe('loco.command.drive', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.runOnlyPendingTimers();
			vi.useRealTimers();
		});

		it('sets locomotive speed and direction and broadcasts updated state', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 42, dir: 'REV', fns: { 1: true } });
			handler.handle({ type: 'loco.command.drive', addr: 5, speed: 42, dir: 'REV' } as ClientToServer);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(5, 42, 'REV');
			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(5, 42, 'REV');
			expect(broadcast).toHaveBeenCalledWith({ type: 'loco.message.state', addr: 5, speed: 42, dir: 'REV', fns: { 1: true } });
		});

		it('sets speed to zero when speed is 0', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {} });
			handler.handle({ type: 'loco.command.drive', addr: 10, speed: 0, dir: 'FWD' } as ClientToServer);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(10, 0, 'FWD');
			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(10, 0, 'FWD');
			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ speed: 0 }));
		});

		it('sets maximum speed when speed is 1', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 1, dir: 'FWD', fns: {} });
			handler.handle({ type: 'loco.command.drive', addr: 10, speed: 1, dir: 'FWD' } as ClientToServer);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(10, 1, 'FWD');
			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(10, 1, 'FWD');
		});

		it('handles FWD direction', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.5, dir: 'FWD', fns: {} });
			handler.handle({ type: 'loco.command.drive', addr: 100, speed: 0.5, dir: 'FWD' } as ClientToServer);

			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(100, 0.5, 'FWD');
			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ dir: 'FWD' }));
		});

		it('handles REV direction', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.5, dir: 'REV', fns: {} });
			handler.handle({ type: 'loco.command.drive', addr: 100, speed: 0.5, dir: 'REV' } as ClientToServer);

			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(100, 0.5, 'REV');
			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ dir: 'REV' }));
		});

		it('broadcasts all function states from locoManager response', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.3, dir: 'FWD', fns: { 0: true, 1: false, 5: true } });
			handler.handle({ type: 'loco.command.drive', addr: 200, speed: 0.3, dir: 'FWD' } as ClientToServer);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ fns: { 0: true, 1: false, 5: true } }));
		});

		it('calls locoManager before z21Service', () => {
			const callOrder: string[] = [];
			locoManager.setSpeed.mockImplementation(() => {
				callOrder.push('locoManager');
				return { speed: 0, dir: 'FWD', fns: {} };
			});
			z21Service.setLocoDrive.mockImplementation(() => callOrder.push('z21'));

			handler.handle({ type: 'loco.command.drive', addr: 1, speed: 0, dir: 'FWD' } as ClientToServer);
			vi.advanceTimersByTime(50);

			expect(callOrder).toEqual(['locoManager', 'z21']);
		});

		it('handles minimum locomotive address', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {} });
			handler.handle({ type: 'loco.command.drive', addr: 1, speed: 0.5, dir: 'FWD' } as ClientToServer);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(1, 0.5, 'FWD');
		});

		it('handles maximum locomotive address', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {} });
			handler.handle({ type: 'loco.command.drive', addr: 9999, speed: 0.5, dir: 'FWD' } as ClientToServer);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(9999, 0.5, 'FWD');
		});
	});

	describe('loco.command.function.set', () => {
		it('sets function to ON and broadcasts updated state', () => {
			locoManager.setFunction.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: false } });
			handler.handle({ type: 'loco.command.function.set', addr: 7, fn: 2, on: false } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(7, 2, false);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(7, 2, LocoFunctionSwitchType.Off);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				addr: 7,
				speed: 13,
				dir: 'FWD',
				fns: { 0: true, 2: false }
			});
		});

		it('sets function to OFF when on is false', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: false } });
			handler.handle({ type: 'loco.command.function.set', addr: 10, fn: 5, on: false } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(10, 5, false);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.Off);
		});

		it('sets function to ON when on is true', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: true } });
			handler.handle({ type: 'loco.command.function.set', addr: 10, fn: 5, on: true } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(10, 5, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.On);
		});

		it('handles function number 0', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 0: true } });
			handler.handle({ type: 'loco.command.function.set', addr: 100, fn: 0, on: true } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(100, 0, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(100, 0, LocoFunctionSwitchType.On);
		});

		it('handles function number 31', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 31: true } });
			handler.handle({ type: 'loco.command.function.set', addr: 100, fn: 31, on: true } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(100, 31, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(100, 31, LocoFunctionSwitchType.On);
		});

		it('calls locoManager before z21Service', () => {
			const callOrder: string[] = [];
			locoManager.setFunction.mockImplementation(() => {
				callOrder.push('locoManager');
				return { speed: 0, dir: 'FWD', fns: {} };
			});
			z21Service.setLocoFunction.mockImplementation(() => callOrder.push('z21'));

			handler.handle({ type: 'loco.command.function.set', addr: 1, fn: 0, on: true } as ClientToServer);

			expect(callOrder).toEqual(['locoManager', 'z21']);
		});
	});

	describe('loco.command.function.toggle', () => {
		it('toggles function from ON to OFF and broadcasts updated state', () => {
			locoManager.getState.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: true } });
			locoManager.setFunction.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: false } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 7, fn: 2 } as ClientToServer);

			expect(locoManager.getState).toHaveBeenCalledWith(7);
			expect(locoManager.setFunction).toHaveBeenCalledWith(7, 2, false);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(7, 2, LocoFunctionSwitchType.Toggle);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				addr: 7,
				speed: 13,
				dir: 'FWD',
				fns: { 0: true, 2: false }
			});
		});

		it('toggles function from OFF to ON', () => {
			locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: false } });
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: true } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 10, fn: 5 } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(10, 5, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.Toggle);
		});

		it('treats undefined function state as OFF and toggles to ON', () => {
			locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: {} });
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 10: true } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 20, fn: 10 } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(20, 10, true);
		});

		it('treats null locomotive state as OFF and toggles to ON', () => {
			locoManager.getState.mockReturnValue(null);
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 10: true } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 30, fn: 10 } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(30, 10, true);
		});

		it('treats undefined locomotive state as OFF and toggles to ON', () => {
			locoManager.getState.mockReturnValue(undefined);
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 10: true } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 40, fn: 10 } as ClientToServer);

			expect(locoManager.setFunction).toHaveBeenCalledWith(40, 10, true);
		});

		it('uses Toggle switch type for z21Service', () => {
			locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: false } });
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: true } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 10, fn: 5 } as ClientToServer);

			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.Toggle);
		});

		it('calls getState before setFunction', () => {
			const callOrder: string[] = [];
			locoManager.getState.mockImplementation(() => {
				callOrder.push('getState');
				return { speed: 0, dir: 'FWD', fns: { 5: true } };
			});
			locoManager.setFunction.mockImplementation(() => {
				callOrder.push('setFunction');
				return { speed: 0, dir: 'FWD', fns: { 5: false } };
			});

			handler.handle({ type: 'loco.command.function.toggle', addr: 1, fn: 5 } as ClientToServer);

			expect(callOrder).toEqual(['getState', 'setFunction']);
		});

		it('broadcasts current speed and direction along with toggled function state', () => {
			locoManager.getState.mockReturnValue({ speed: 0.5, dir: 'REV', fns: { 15: false } });
			locoManager.setFunction.mockReturnValue({ speed: 0.5, dir: 'REV', fns: { 15: true } });
			handler.handle({ type: 'loco.command.function.toggle', addr: 100, fn: 15 } as ClientToServer);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ speed: 0.5, dir: 'REV' }));
		});
	});

	describe('switching.command.turnout.set', () => {
		it('sets turnout to STRAIGHT and calls getTurnoutInfo', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 9, state: TurnoutState.STRAIGHT } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(9, 0, { queue: true, pulseMs: 100 });
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(9);
		});

		it('sets turnout to DIVERGING and calls getTurnoutInfo', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 9, state: TurnoutState.DIVERGING } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(9, 1, { queue: true, pulseMs: 100 });
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(9);
		});

		it('uses default pulseMs of 100 when not specified', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 20, state: TurnoutState.STRAIGHT } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(20, 0, { queue: true, pulseMs: 100 });
		});

		it('uses custom pulseMs when specified', () => {
			handler.handle({
				type: 'switching.command.turnout.set',
				addr: 20,
				state: TurnoutState.STRAIGHT,
				pulseMs: 200
			} as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(20, 0, { queue: true, pulseMs: 200 });
		});

		it('always sets queue to true', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 30, state: TurnoutState.STRAIGHT } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(30, 0, expect.objectContaining({ queue: true }));
		});

		it('calls setTurnout before getTurnoutInfo', () => {
			const callOrder: string[] = [];
			z21Service.setTurnout.mockImplementation(() => callOrder.push('setTurnout'));
			z21Service.getTurnoutInfo.mockImplementation(() => callOrder.push('getTurnoutInfo'));

			handler.handle({ type: 'switching.command.turnout.set', addr: 1, state: TurnoutState.STRAIGHT } as ClientToServer);

			expect(callOrder).toEqual(['setTurnout', 'getTurnoutInfo']);
		});

		it('handles minimum accessory address', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 0, state: TurnoutState.STRAIGHT } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(0, 0, expect.any(Object));
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(0);
		});

		it('handles maximum accessory address', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 16383, state: TurnoutState.DIVERGING } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(16383, 1, expect.any(Object));
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(16383);
		});

		it('handles pulseMs of 0', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 50, state: TurnoutState.STRAIGHT, pulseMs: 0 } as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(50, 0, { queue: true, pulseMs: 0 });
		});

		it('handles large pulseMs values', () => {
			handler.handle({
				type: 'switching.command.turnout.set',
				addr: 50,
				state: TurnoutState.STRAIGHT,
				pulseMs: 5000
			} as ClientToServer);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(50, 0, { queue: true, pulseMs: 5000 });
		});

		it('does not broadcast turnout state', () => {
			handler.handle({ type: 'switching.command.turnout.set', addr: 100, state: TurnoutState.STRAIGHT } as ClientToServer);

			expect(broadcast).not.toHaveBeenCalled();
		});
	});

	describe('loco.command.stop.all', () => {
		it('sends stop command to z21Service', () => {
			handler.handle({ type: 'loco.command.stop.all' } as ClientToServer);

			expect(z21Service.setStop).toHaveBeenCalled();
		});

		it('does not broadcast when loco.command.stop.all is issued', () => {
			handler.handle({ type: 'loco.command.stop.all' } as ClientToServer);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('calls setStop exactly once', () => {
			handler.handle({ type: 'loco.command.stop.all' } as ClientToServer);

			expect(z21Service.setStop).toHaveBeenCalledTimes(1);
		});
	});

	describe('loco.eStop', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.clearAllTimers();
			vi.useRealTimers();
		});

		it('sends emergency stop and requests loco info', () => {
			handler.handle({ type: 'loco.command.eStop', addr: 99 } as ClientToServer);

			expect(z21Service.setLocoEStop).toHaveBeenCalledWith(99);
			expect(z21Service.getLocoInfo).toHaveBeenCalledWith(99);
		});

		it('cancels pending throttled drive before it fires', () => {
			handler.handle({ type: 'loco.command.drive', addr: 5, speed: 0.7, dir: 'FWD' } as ClientToServer);
			handler.handle({ type: 'loco.command.eStop', addr: 5 } as ClientToServer);

			vi.advanceTimersByTime(100);

			expect(z21Service.setLocoDrive).not.toHaveBeenCalledWith(5, expect.anything(), expect.anything());
			// emergency stop still issued
			expect(z21Service.setLocoEStop).toHaveBeenCalledWith(5);
		});
	});
});
