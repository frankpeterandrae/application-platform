/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LocoManager } from '@application-platform/domain';
import type { ClientToServer } from '@application-platform/protocol';
import { DeepMock, DeepMocked } from '@application-platform/shared-node-test';
import { LocoFunctionSwitchType, Z21CommandService } from '@application-platform/z21';
import { TurnoutState } from '@application-platform/z21-shared';
import type { Mock as VitestMock, MockedFunction } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CvProgrammingService } from '../services/cv-programming-service';

import { ClientMessageHandler, type BroadcastFn, type ReplyFn } from './client-message-handler';

describe('ClientMessageHandler.handle', () => {
	let broadcast: MockedFunction<BroadcastFn>;
	let locoManager: DeepMocked<LocoManager>;
	let z21Service: DeepMocked<Z21CommandService>;
	let handler: ClientMessageHandler;
	let cvProgrammingService: DeepMocked<CvProgrammingService>;
	let reply: ReplyFn;

	const ws: any = { id: 'ws-1' };

	beforeEach(() => {
		broadcast = vi.fn();
		locoManager = DeepMock<LocoManager>();
		z21Service = DeepMock<Z21CommandService>();
		cvProgrammingService = DeepMock<CvProgrammingService>();
		reply = vi.fn();

		// Configure default mock return values
		locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });
		locoManager.setFunction.mockReturnValue({ speed: 10, dir: 'REV', fns: { 0: true }, estop: false });
		locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });
		cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 1, cvValue: 0 });
		cvProgrammingService.writeCv.mockResolvedValue(undefined);

		handler = new ClientMessageHandler(locoManager as any, z21Service as any, cvProgrammingService, reply, broadcast);
	});

	it('ignores server.command.session.hello messages', () => {
		// Initialize mocks before checking them
		(z21Service.sendTrackPower as VitestMock).mockClear();

		void handler.handle({ type: 'server.command.session.hello' } as ClientToServer, ws);
		expect(broadcast).not.toHaveBeenCalled();
		expect(z21Service.sendTrackPower).not.toHaveBeenCalled();
	});

	describe('system.command.trackpower.set', () => {
		it('sends power ON command and broadcasts power state when on is true', () => {
			void handler.handle({ type: 'system.command.trackpower.set', payload: { powerOn: true } } as ClientToServer, ws);
			expect(z21Service.sendTrackPower).toHaveBeenCalledWith(true);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				payload: { powerOn: true, shortCircuit: false, emergencyStop: false, programmingMode: false }
			});
		});

		it('sends power OFF command and broadcasts power state when on is false', () => {
			void handler.handle({ type: 'system.command.trackpower.set', payload: { powerOn: false } } as ClientToServer, ws);
			expect(z21Service.sendTrackPower).toHaveBeenCalledWith(false);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				payload: { powerOn: false, shortCircuit: false, emergencyStop: false, programmingMode: false }
			});
		});

		it('calls z21Service before broadcast', () => {
			const callOrder: string[] = [];
			z21Service.sendTrackPower.mockImplementation(() => callOrder.push('z21'));
			broadcast.mockImplementation(() => callOrder.push('broadcast'));

			void handler.handle({ type: 'system.command.trackpower.set', payload: { powerOn: true } } as ClientToServer, ws);

			expect(callOrder).toEqual(['z21', 'broadcast']);
		});

		it('always sets shortCircuit flag to false in broadcast', () => {
			void handler.handle({ type: 'system.command.trackpower.set', payload: { powerOn: true } } as ClientToServer, ws);
			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ shortCircuit: false }) }));
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
			locoManager.setSpeed.mockReturnValue({ speed: 42, dir: 'REV', fns: { 1: true }, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 5, speed: 42, dir: 'REV' } } as ClientToServer, ws);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(5, 42, 'REV');
			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(5, 42, 'REV');
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 5, speed: 42, dir: 'REV', fns: { 1: true }, estop: false }
			});
		});

		it('sets speed to zero when speed is 0', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 10, speed: 0, dir: 'FWD' } } as ClientToServer, ws);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(10, 0, 'FWD');
			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(10, 0, 'FWD');
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 10, dir: 'FWD', fns: {}, speed: 0, estop: false }
			});
		});

		it('sets maximum speed when speed is 1', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 1, dir: 'FWD', fns: {}, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 10, speed: 1, dir: 'FWD' } } as ClientToServer, ws);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(10, 1, 'FWD');
			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(10, 1, 'FWD');
		});

		it('handles FWD direction', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.5, dir: 'FWD', fns: {}, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 100, speed: 0.5, dir: 'FWD' } } as ClientToServer, ws);

			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(100, 0.5, 'FWD');
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 100, dir: 'FWD', fns: {}, speed: 0.5, estop: false }
			});
		});

		it('handles REV direction', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.5, dir: 'REV', fns: {}, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 100, speed: 0.5, dir: 'REV' } } as ClientToServer, ws);

			vi.advanceTimersByTime(50);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(100, 0.5, 'REV');
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 100, dir: 'REV', estop: false, fns: {}, speed: 0.5 }
			});
		});

		it('broadcasts all function states from locoManager response', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.3, dir: 'FWD', fns: { 0: true, 1: false, 5: true }, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 200, speed: 0.3, dir: 'FWD' } } as ClientToServer, ws);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 200, dir: 'FWD', estop: false, fns: { '0': true, '1': false, '5': true }, speed: 0.3 }
			});
		});

		it('calls locoManager before z21Service', () => {
			const callOrder: string[] = [];
			locoManager.setSpeed.mockImplementation(() => {
				callOrder.push('locoManager');
				return { speed: 0, dir: 'FWD', fns: {}, estop: false };
			});
			z21Service.setLocoDrive.mockImplementation(() => callOrder.push('z21'));

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 1, speed: 0, dir: 'FWD' } } as ClientToServer, ws);
			vi.advanceTimersByTime(50);

			expect(callOrder).toEqual(['locoManager', 'z21']);
		});

		it('handles minimum locomotive address', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 1, speed: 0.5, dir: 'FWD' } } as ClientToServer, ws);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(1, 0.5, 'FWD');
		});

		it('handles maximum locomotive address', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 9999, speed: 0.5, dir: 'FWD' } } as ClientToServer, ws);

			expect(locoManager.setSpeed).toHaveBeenCalledWith(9999, 0.5, 'FWD');
		});
	});

	describe('loco.command.function.set', () => {
		it('sets function to ON and broadcasts updated state', () => {
			locoManager.setFunction.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: false }, estop: false });
			void handler.handle({ type: 'loco.command.function.set', payload: { addr: 7, fn: 2, on: false } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(7, 2, false);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(7, 2, LocoFunctionSwitchType.Off);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: {
					addr: 7,
					speed: 13,
					dir: 'FWD',
					fns: { 0: true, 2: false },
					estop: false
				}
			});
		});

		it('sets function to OFF when on is false', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: false }, estop: false });
			void handler.handle({ type: 'loco.command.function.set', payload: { addr: 10, fn: 5, on: false } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(10, 5, false);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.Off);
		});

		it('sets function to ON when on is true', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.set', payload: { addr: 10, fn: 5, on: true } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(10, 5, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.On);
		});

		it('handles function number 0', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 0: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.set', payload: { addr: 100, fn: 0, on: true } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(100, 0, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(100, 0, LocoFunctionSwitchType.On);
		});

		it('handles function number 31', () => {
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 31: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.set', payload: { addr: 100, fn: 31, on: true } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(100, 31, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(100, 31, LocoFunctionSwitchType.On);
		});

		it('calls locoManager before z21Service', () => {
			const callOrder: string[] = [];
			locoManager.setFunction.mockImplementation(() => {
				callOrder.push('locoManager');
				return { speed: 0, dir: 'FWD', fns: {}, estop: false };
			});
			z21Service.setLocoFunction.mockImplementation(() => callOrder.push('z21'));

			void handler.handle({ type: 'loco.command.function.set', payload: { addr: 1, fn: 0, on: true } } as ClientToServer, ws);

			expect(callOrder).toEqual(['locoManager', 'z21']);
		});
	});

	describe('loco.command.function.toggle', () => {
		it('toggles function from ON to OFF and broadcasts updated state', () => {
			locoManager.getState.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: true }, estop: false });
			locoManager.setFunction.mockReturnValue({ speed: 13, dir: 'FWD', fns: { 0: true, 2: false }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 7, fn: 2 } } as ClientToServer, ws);

			expect(locoManager.getState).toHaveBeenCalledWith(7);
			expect(locoManager.setFunction).toHaveBeenCalledWith(7, 2, false);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(7, 2, LocoFunctionSwitchType.Toggle);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: {
					addr: 7,
					speed: 13,
					dir: 'FWD',
					fns: { 0: true, 2: false },
					estop: false
				}
			});
		});

		it('toggles function from OFF to ON', () => {
			locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: false }, estop: false });
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 10, fn: 5 } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(10, 5, true);
			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.Toggle);
		});

		it('treats undefined function state as OFF and toggles to ON', () => {
			locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 10: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 20, fn: 10 } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(20, 10, true);
		});

		it('treats null locomotive state as OFF and toggles to ON', () => {
			locoManager.getState.mockReturnValue(undefined);
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 10: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 30, fn: 10 } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(30, 10, true);
		});

		it('treats undefined locomotive state as OFF and toggles to ON', () => {
			locoManager.getState.mockReturnValue(undefined);
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 10: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 40, fn: 10 } } as ClientToServer, ws);

			expect(locoManager.setFunction).toHaveBeenCalledWith(40, 10, true);
		});

		it('uses Toggle switch type for z21Service', () => {
			locoManager.getState.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: false }, estop: false });
			locoManager.setFunction.mockReturnValue({ speed: 0, dir: 'FWD', fns: { 5: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 10, fn: 5 } } as ClientToServer, ws);

			expect(z21Service.setLocoFunction).toHaveBeenCalledWith(10, 5, LocoFunctionSwitchType.Toggle);
		});

		it('calls getState before setFunction', () => {
			const callOrder: string[] = [];
			locoManager.getState.mockImplementation(() => {
				callOrder.push('getState');
				return { speed: 0, dir: 'FWD', fns: { 5: true }, estop: false };
			});
			locoManager.setFunction.mockImplementation(() => {
				callOrder.push('setFunction');
				return { speed: 0, dir: 'FWD', fns: { 5: false }, estop: false };
			});

			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 1, fn: 5 } } as ClientToServer, ws);

			expect(callOrder).toEqual(['getState', 'setFunction']);
		});

		it('broadcasts current speed and direction along with toggled function state', () => {
			locoManager.getState.mockReturnValue({ speed: 0.5, dir: 'REV', fns: { 15: false }, estop: false });
			locoManager.setFunction.mockReturnValue({ speed: 0.5, dir: 'REV', fns: { 15: true }, estop: false });
			void handler.handle({ type: 'loco.command.function.toggle', payload: { addr: 100, fn: 15 } } as ClientToServer, ws);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 100, dir: 'REV', estop: false, fns: { '15': true }, speed: 0.5 }
			});
		});
	});

	describe('switching.command.turnout.set', () => {
		it('sets turnout to STRAIGHT and calls getTurnoutInfo', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 9, state: TurnoutState.STRAIGHT } } as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(9, 0, { queue: true, pulseMs: 100 });
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(9);
		});

		it('sets turnout to DIVERGING and calls getTurnoutInfo', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 9, state: TurnoutState.DIVERGING } } as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(9, 1, { queue: true, pulseMs: 100 });
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(9);
		});

		it('uses default pulseMs of 100 when not specified', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 20, state: TurnoutState.STRAIGHT } } as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(20, 0, { queue: true, pulseMs: 100 });
		});

		it('uses custom pulseMs when specified', () => {
			void handler.handle(
				{
					type: 'switching.command.turnout.set',
					payload: { addr: 20, state: TurnoutState.STRAIGHT, pulseMs: 200 }
				} as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(20, 0, { queue: true, pulseMs: 200 });
		});

		it('always sets queue to true', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 30, state: TurnoutState.STRAIGHT } } as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(30, 0, expect.objectContaining({ queue: true }));
		});

		it('calls setTurnout before getTurnoutInfo', () => {
			const callOrder: string[] = [];
			z21Service.setTurnout.mockImplementation(() => callOrder.push('setTurnout'));
			z21Service.getTurnoutInfo.mockImplementation(() => callOrder.push('getTurnoutInfo'));

			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 1, state: TurnoutState.STRAIGHT } } as ClientToServer,
				ws
			);

			expect(callOrder).toEqual(['setTurnout', 'getTurnoutInfo']);
		});

		it('handles minimum accessory address', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 0, state: TurnoutState.STRAIGHT } } as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(0, 0, expect.any(Object));
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(0);
		});

		it('handles maximum accessory address', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 16383, state: TurnoutState.DIVERGING } } as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(16383, 1, expect.any(Object));
			expect(z21Service.getTurnoutInfo).toHaveBeenCalledWith(16383);
		});

		it('handles pulseMs of 0', () => {
			void handler.handle(
				{
					type: 'switching.command.turnout.set',
					payload: { addr: 50, state: TurnoutState.STRAIGHT, pulseMs: 0 }
				} as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(50, 0, { queue: true, pulseMs: 0 });
		});

		it('handles large pulseMs values', () => {
			void handler.handle(
				{
					type: 'switching.command.turnout.set',
					payload: { addr: 50, state: TurnoutState.STRAIGHT, pulseMs: 5000 }
				} as ClientToServer,
				ws
			);

			expect(z21Service.setTurnout).toHaveBeenCalledWith(50, 0, { queue: true, pulseMs: 5000 });
		});

		it('does not broadcast turnout state', () => {
			void handler.handle(
				{ type: 'switching.command.turnout.set', payload: { addr: 100, state: TurnoutState.STRAIGHT } } as ClientToServer,
				ws
			);

			expect(broadcast).not.toHaveBeenCalled();
		});
	});

	describe('loco.command.stop.all', () => {
		it('sends stop command to z21Service', () => {
			void handler.handle({ type: 'loco.command.stop.all' } as ClientToServer, ws);

			expect(z21Service.setStop).toHaveBeenCalled();
		});

		it('does not broadcast when loco.command.stop.all is issued', () => {
			void handler.handle({ type: 'loco.command.stop.all' } as ClientToServer, ws);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('calls setStop exactly once', () => {
			void handler.handle({ type: 'loco.command.stop.all' } as ClientToServer, ws);

			expect(z21Service.setStop).toHaveBeenCalledTimes(1);
		});
	});

	describe('loco.command.eStop', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.clearAllTimers();
			vi.useRealTimers();
		});

		it('sends emergency stop and requests loco info', () => {
			void handler.handle({ type: 'loco.command.eStop', payload: { addr: 99 } } as ClientToServer, ws);

			expect(z21Service.setLocoEStop).toHaveBeenCalledWith(99);
			expect(z21Service.getLocoInfo).toHaveBeenCalledWith(99);
		});

		it('cancels pending throttled drive before it fires', () => {
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 5, speed: 0.7, dir: 'FWD' } } as ClientToServer, ws);
			void handler.handle({ type: 'loco.command.eStop', payload: { addr: 5 } } as ClientToServer, ws);

			// Initialize mock before checking
			(z21Service.setLocoDrive as VitestMock).mockClear();

			vi.advanceTimersByTime(100);

			expect(z21Service.setLocoDrive).not.toHaveBeenCalledWith(5, expect.anything(), expect.anything());
			// emergency stop still issued
			expect(z21Service.setLocoEStop).toHaveBeenCalledWith(5);
		});

		it('does not broadcast loco.message.state on emergency stop', () => {
			void handler.handle({ type: 'loco.command.eStop', payload: { addr: 15 } } as ClientToServer, ws);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('clears both pending drive data and timer on emergency stop', () => {
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 8, speed: 0.3, dir: 'REV' } } as ClientToServer, ws);

			(z21Service.setLocoDrive as VitestMock).mockClear();
			void handler.handle({ type: 'loco.command.eStop', payload: { addr: 8 } } as ClientToServer, ws);

			vi.advanceTimersByTime(100);

			expect(z21Service.setLocoDrive).not.toHaveBeenCalled();
		});

		it('calls setLocoEStop before getLocoInfo', () => {
			const callOrder: string[] = [];
			z21Service.setLocoEStop.mockImplementation(() => callOrder.push('eStop'));
			z21Service.getLocoInfo.mockImplementation(() => callOrder.push('getInfo'));

			void handler.handle({ type: 'loco.command.eStop', payload: { addr: 1 } } as ClientToServer, ws);

			expect(callOrder).toEqual(['eStop', 'getInfo']);
		});
	});

	describe('programming.command.cv.read', () => {
		it('reads CV and replies with result on success', async () => {
			cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 29, cvValue: 42 });

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 29, requestId: 'req-1' } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.readCv).toHaveBeenCalledWith(29);
			expect(reply).toHaveBeenCalledWith(ws, {
				type: 'programming.replay.cv.result',
				payload: {
					requestId: 'req-1',
					cvAdress: 29,
					cvValue: 42
				}
			});
		});

		it('replies with nack on read failure', async () => {
			cvProgrammingService.readCv.mockRejectedValue(new Error('CV programming timeout'));

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 1, requestId: 'req-2' } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(ws, {
				type: 'programming.replay.cv.nack',
				payload: {
					requestId: 'req-2',
					error: 'CV programming timeout'
				}
			});
		});

		it('includes requestId in result when provided', async () => {
			cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 17, cvValue: 100 });

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 17, requestId: 'test-123' } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(
				ws,
				expect.objectContaining({
					payload: expect.objectContaining({ requestId: 'test-123' })
				})
			);
		});

		it('handles undefined requestId gracefully', async () => {
			cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 5, cvValue: 10 });

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 5, requestId: undefined as any } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(
				ws,
				expect.objectContaining({
					payload: expect.objectContaining({ requestId: undefined })
				})
			);
		});

		it('does not broadcast CV read results', async () => {
			cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 10, cvValue: 20 });

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 10, requestId: 'req-3' } } as ClientToServer,
				ws
			);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('replies with nack containing error message on shortCircuit circuit', async () => {
			cvProgrammingService.readCv.mockRejectedValue(new Error('Short circuit detected'));

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 50, requestId: 'req-4' } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(ws, {
				type: 'programming.replay.cv.nack',
				payload: {
					requestId: 'req-4',
					error: 'Short circuit detected'
				}
			});
		});

		it('handles CV address 1', async () => {
			cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 1, cvValue: 3 });

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 1, requestId: 'req-5' } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.readCv).toHaveBeenCalledWith(1);
		});

		it('handles CV address 1024', async () => {
			cvProgrammingService.readCv.mockResolvedValue({ cvAdress: 1024, cvValue: 255 });

			await handler.handle(
				{ type: 'programming.command.cv.read', payload: { cvAdress: 1024, requestId: 'req-6' } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.readCv).toHaveBeenCalledWith(1024);
		});
	});

	describe('programming.command.cv.write', () => {
		it('writes CV and replies with result on success', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 29, cvValue: 14, requestId: 'req-7' } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.writeCv).toHaveBeenCalledWith(29, 14);
			expect(reply).toHaveBeenCalledWith(ws, {
				type: 'programming.replay.cv.result',
				payload: {
					requestId: 'req-7',
					cvAdress: 29,
					cvValue: 14
				}
			});
		});

		it('replies with nack on write failure', async () => {
			cvProgrammingService.writeCv.mockRejectedValue(new Error('CV write failed'));

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 8, cvValue: 100, requestId: 'req-8' } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(ws, {
				type: 'programming.replay.cv.nack',
				payload: {
					requestId: 'req-8',
					error: 'CV write failed'
				}
			});
		});

		it('includes requestId in result when provided', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 1, cvValue: 3, requestId: 'write-123' } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(
				ws,
				expect.objectContaining({
					payload: expect.objectContaining({ requestId: 'write-123' })
				})
			);
		});

		it('handles undefined requestId gracefully', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{
					type: 'programming.command.cv.write',
					payload: { cvAdress: 5, cvValue: 50, requestId: undefined as any }
				} as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(
				ws,
				expect.objectContaining({
					payload: expect.objectContaining({ requestId: undefined })
				})
			);
		});

		it('does not broadcast CV write results', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 20, cvValue: 200, requestId: 'req-9' } } as ClientToServer,
				ws
			);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('writes CV value 0', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 10, cvValue: 0, requestId: 'req-10' } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.writeCv).toHaveBeenCalledWith(10, 0);
		});

		it('writes CV value 255', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 100, cvValue: 255, requestId: 'req-11' } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.writeCv).toHaveBeenCalledWith(100, 255);
		});

		it('replies with confirmation containing written value', async () => {
			cvProgrammingService.writeCv.mockResolvedValue(undefined);

			await handler.handle(
				{ type: 'programming.command.cv.write', payload: { cvAdress: 50, cvValue: 128, requestId: 'req-12' } } as ClientToServer,
				ws
			);

			expect(reply).toHaveBeenCalledWith(
				ws,
				expect.objectContaining({
					payload: expect.objectContaining({ cvValue: 128 })
				})
			);
		});
	});

	describe('programming.command.pom.cv.read', () => {
		it('does not throw error for unimplemented POM read', () => {
			expect(() => {
				void handler.handle(
					{ type: 'programming.command.pom.cv.read', payload: { address: 3, cvAdress: 29 } } as ClientToServer,
					ws
				);
			}).not.toThrow();
		});

		it('does not call cvProgrammingService for POM read', () => {
			void handler.handle({ type: 'programming.command.pom.cv.read', payload: { address: 3, cvAdress: 29 } } as ClientToServer, ws);

			expect(cvProgrammingService.readCv).not.toHaveBeenCalled();
		});

		it('does not broadcast or reply for unimplemented POM read', () => {
			void handler.handle({ type: 'programming.command.pom.cv.read', payload: { address: 3, cvAdress: 29 } } as ClientToServer, ws);

			expect(broadcast).not.toHaveBeenCalled();
			expect(reply).not.toHaveBeenCalled();
		});
	});

	describe('programming.command.pom.cv.write', () => {
		it('does not throw error for unimplemented POM write', () => {
			expect(() => {
				void handler.handle(
					{ type: 'programming.command.pom.cv.write', payload: { adress: 5, cvAddress: 17, cvValue: 50 } } as ClientToServer,
					ws
				);
			}).not.toThrow();
		});

		it('does not call cvProgrammingService for POM write', () => {
			void handler.handle(
				{ type: 'programming.command.pom.cv.write', payload: { adress: 5, cvAddress: 17, cvValue: 50 } } as ClientToServer,
				ws
			);

			expect(cvProgrammingService.writeCv).not.toHaveBeenCalled();
		});

		it('does not broadcast or reply for unimplemented POM write', () => {
			void handler.handle(
				{ type: 'programming.command.pom.cv.write', payload: { adress: 5, cvAddress: 17, cvValue: 50 } } as ClientToServer,
				ws
			);

			expect(broadcast).not.toHaveBeenCalled();
			expect(reply).not.toHaveBeenCalled();
		});
	});

	describe('drive throttling', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.runOnlyPendingTimers();
			vi.useRealTimers();
		});

		it('throttles multiple drive commands for same locomotive', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 10, speed: 0.1, dir: 'FWD' } } as ClientToServer, ws);
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 10, speed: 0.2, dir: 'FWD' } } as ClientToServer, ws);
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 10, speed: 0.3, dir: 'FWD' } } as ClientToServer, ws);

			vi.advanceTimersByTime(50);

			expect(z21Service.setLocoDrive).toHaveBeenCalledTimes(1);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(10, 0.3, 'FWD');
		});

		it('does not throttle drive commands for different locomotives', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 1, speed: 0.5, dir: 'FWD' } } as ClientToServer, ws);
			void handler.handle({ type: 'loco.command.drive', payload: { addr: 2, speed: 0.6, dir: 'REV' } } as ClientToServer, ws);

			vi.advanceTimersByTime(50);

			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(1, 0.5, 'FWD');
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(2, 0.6, 'REV');
		});

		it('sends only the last speed/direction after throttle period', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: false });

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 15, speed: 0.1, dir: 'FWD' } } as ClientToServer, ws);
			vi.advanceTimersByTime(25);

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 15, speed: 0.5, dir: 'REV' } } as ClientToServer, ws);
			vi.advanceTimersByTime(25);

			expect(z21Service.setLocoDrive).toHaveBeenCalledTimes(1);
			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(15, 0.5, 'REV');
		});

		it('broadcasts immediately but throttles Z21 command', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.7, dir: 'FWD', fns: {}, estop: false });
			(z21Service.setLocoDrive as VitestMock).mockClear();

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 20, speed: 0.7, dir: 'FWD' } } as ClientToServer, ws);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 20, dir: 'FWD', fns: {}, speed: 0.7, estop: false }
			});
			expect(z21Service.setLocoDrive).not.toHaveBeenCalled();

			vi.advanceTimersByTime(50);

			expect(z21Service.setLocoDrive).toHaveBeenCalledWith(20, 0.7, 'FWD');
		});

		it('broadcasts estop flag when present in locomotive state', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0, dir: 'FWD', fns: {}, estop: true });

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 25, speed: 0, dir: 'FWD' } } as ClientToServer, ws);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 25, dir: 'FWD', estop: true, fns: {}, speed: 0 }
			});
		});

		it('broadcasts estop false when not in emergency stop', () => {
			locoManager.setSpeed.mockReturnValue({ speed: 0.5, dir: 'FWD', fns: {}, estop: false });

			void handler.handle({ type: 'loco.command.drive', payload: { addr: 30, speed: 0.5, dir: 'FWD' } } as ClientToServer, ws);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				payload: { addr: 30, dir: 'FWD', estop: false, fns: {}, speed: 0.5 }
			});
		});
	});
});
