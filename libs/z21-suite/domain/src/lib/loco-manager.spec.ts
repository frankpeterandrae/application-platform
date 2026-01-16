/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LocoManager } from './loco-manager';

describe('LocoManager', () => {
	let manager: LocoManager;

	beforeEach(() => {
		manager = new LocoManager();
	});

	it('returns undefined for unknown loco', () => {
		expect(manager.getState(1)).toBeUndefined();
	});

	it('creates default state and sets speed and direction', () => {
		const state = manager.setSpeed(3, 0.5, 'REV');
		expect(state).toEqual({ speed: 0.5, dir: 'REV', fns: {} });
		expect(manager.getState(3)).toEqual({ speed: 0.5, dir: 'REV', fns: {} });
	});

	it('clamps speed below zero to zero', () => {
		const state = manager.setSpeed(2, -0.3, 'FWD');
		expect(state.speed).toBe(0);
	});

	it('clamps speed above one to one', () => {
		const state = manager.setSpeed(2, 5, 'FWD');
		expect(state.speed).toBe(1);
	});

	it('clamps non-finite speed to zero', () => {
		const stateNaN = manager.setSpeed(4, Number.NaN, 'FWD');
		const stateInf = manager.setSpeed(5, Number.POSITIVE_INFINITY, 'FWD');
		expect(stateNaN.speed).toBe(0);
		expect(stateInf.speed).toBe(0);
	});

	it('updates direction and preserves previous functions', () => {
		manager.setFunction(7, 1, true);
		const state = manager.setSpeed(7, 0.2, 'REV');
		expect(state).toEqual({ speed: 0.2, dir: 'REV', fns: { 1: true } });
	});

	it('sets function state and creates default loco if missing', () => {
		const state = manager.setFunction(9, 3, true);
		expect(state).toEqual({ speed: 0, dir: 'FWD', fns: { 3: true } });
		expect(manager.getState(9)).toEqual({ speed: 0, dir: 'FWD', fns: { 3: true } });
	});

	it('overwrites existing function state', () => {
		manager.setFunction(9, 3, true);
		const state = manager.setFunction(9, 3, false);
		expect(state.fns[3]).toBe(false);
	});

	it('returns shallow copy from getAllStates', () => {
		manager.setSpeed(1, 0.5, 'FWD');
		const states = manager.getAllStates();
		states.set(1, { speed: 0, dir: 'REV', fns: {} });
		expect(manager.getState(1)).toEqual({ speed: 0.5, dir: 'FWD', fns: {} });
	});

	it('stopAll sets speed to zero and returns stopped states', () => {
		manager.setSpeed(1, 0.4, 'FWD');
		manager.setFunction(1, 0, true);
		manager.setSpeed(2, 0.9, 'REV');
		const stopped = manager.stopAll();
		expect(stopped).toEqual([
			{ addr: 1, state: { speed: 0, dir: 'FWD', fns: { 0: true } } },
			{ addr: 2, state: { speed: 0, dir: 'REV', fns: {} } }
		]);
		expect(manager.getState(1)?.speed).toBe(0);
		expect(manager.getState(2)?.speed).toBe(0);
	});

	it('updateLocoInfoFromZ21 sets estop flag when emergencyStop is true', () => {
		const result = manager.updateLocoInfoFromZ21({
			addr: 100,
			speed: 0.5,
			forward: true,
			functionMap: {},
			isMmLoco: false,
			isOccupied: true,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 28,
			emergencyStop: true
		} as any);

		expect(result.state.estop).toBe(true);
		expect(manager.getState(100)?.estop).toBe(true);
	});

	it('updateLocoInfoFromZ21 sets estop false when emergencyStop is false', () => {
		const result = manager.updateLocoInfoFromZ21({
			addr: 200,
			speed: 0.3,
			forward: false,
			functionMap: { 0: true, 5: false },
			isMmLoco: false,
			isOccupied: false,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 128,
			emergencyStop: false
		} as any);

		expect(result.state.estop).toBe(false);
		expect(manager.getState(200)?.estop).toBe(false);
	});

	it('updateLocoInfoFromZ21 updates estop and speed simultaneously', () => {
		manager.setSpeed(50, 0.5, 'FWD');
		const result = manager.updateLocoInfoFromZ21({
			addr: 50,
			speed: 0.0,
			forward: true,
			functionMap: {},
			isMmLoco: false,
			isOccupied: true,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 28,
			emergencyStop: true
		} as any);

		expect(result.state.speed).toBe(0);
		expect(result.state.estop).toBe(true);
	});

	it('updateLocoInfoFromZ21 preserves previous estop state when updating', () => {
		manager.updateLocoInfoFromZ21({
			addr: 75,
			speed: 0.5,
			forward: true,
			functionMap: { 0: true },
			isMmLoco: false,
			isOccupied: false,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 28,
			emergencyStop: true
		} as any);

		manager.updateLocoInfoFromZ21({
			addr: 75,
			speed: 0.7,
			forward: true,
			functionMap: { 0: true },
			isMmLoco: false,
			isOccupied: false,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 28,
			emergencyStop: false
		} as any);

		expect(manager.getState(75)?.estop).toBe(false);
	});

	it('ensureLoco creates loco with undefined estop', () => {
		const state = manager.ensureLoco(300);
		expect(state.estop).toBeUndefined();
		expect(manager.getState(300)).toEqual({ speed: 0, dir: 'FWD', fns: {} });
	});

	it('subscribeLocoInfoOnce returns true on first call', () => {
		const result = manager.subscribeLocoInfoOnce(400);
		expect(result).toBe(true);
		expect(manager.getState(400)).toBeDefined();
	});

	it('subscribeLocoInfoOnce returns false on second call', () => {
		manager.subscribeLocoInfoOnce(500);
		const result = manager.subscribeLocoInfoOnce(500);
		expect(result).toBe(false);
	});

	it('stopAll preserves estop state when setting speed to zero', () => {
		manager.updateLocoInfoFromZ21({
			addr: 600,
			speed: 0.6,
			forward: true,
			functionMap: {},
			isMmLoco: false,
			isOccupied: false,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 28,
			emergencyStop: true
		} as any);

		const stopped = manager.stopAll();
		const stoppedState = stopped.find((s) => s.addr === 600);
		expect(stoppedState?.state.speed).toBe(0);
		expect(stoppedState?.state.estop).toBe(true);
	});
});
