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

	it('subscribeLocoInfoOnce returns true when new and false on subsequent calls', () => {
		const res1 = manager.subscribeLocoInfoOnce(42);
		expect(res1).toBe(true);
		const res2 = manager.subscribeLocoInfoOnce(42);
		expect(res2).toBe(false);
		// subscribe should ensure loco exists
		expect(manager.getState(42)).toBeDefined();
	});

	it('updateLocoInfoFromZ21 updates loco state and returns addr/state pair', () => {
		const info = { addr: 99, speedRaw: 0.75, forward: false, functionMap: { 0: true, 2: true } } as any;
		const res = manager.updateLocoInfoFromZ21(info);
		expect(res.addr).toBe(99);
		expect(res.state.speed).toBe(0.75);
		expect(res.state.dir).toBe('REV');
		expect(res.state.fns[0]).toBe(true);
		expect(res.state.fns[2]).toBe(true);
	});
});
