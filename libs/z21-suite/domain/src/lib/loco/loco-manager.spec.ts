/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoInfoEventPayload } from '@application-platform/z21-shared';

import { LocoManager } from './loco-manager';

describe('LocoManager', () => {
	let manager: LocoManager;

	beforeEach(() => {
		manager = new LocoManager();
	});

	function makeZ21LocoInfo(overrides: Partial<LocoInfoEventPayload> = {}): LocoInfoEventPayload {
		return {
			addr: 100,
			speed: 0.5,
			direction: 'FWD',
			functionMap: {},
			isMmLoco: false,
			isOccupied: false,
			isDoubleTraction: false,
			isSmartsearch: false,
			speedSteps: 28,
			emergencyStop: false,
			...overrides
		};
	}

	describe('state management', () => {
		it('returns undefined for an unknown locomotive', () => {
			expect(manager.getState(1)).toBeUndefined();
		});

		it('creates a default state when setting speed', () => {
			const state = manager.setSpeed(3, 0.5, 'REV');

			expect(state).toEqual({
				speed: 0.5,
				dir: 'REV',
				fns: {},
				estop: false
			});

			expect(manager.getState(3)).toEqual(state);
		});

		it('ensures a default locomotive state', () => {
			const state = manager.ensureLoco(10);

			expect(state).toEqual({
				speed: 0,
				dir: 'FWD',
				fns: {},
				estop: false
			});

			expect(manager.getState(10)).toEqual(state);
		});

		it('does not expose mutable state through getState', () => {
			manager.setFunction(1, 0, true);
			manager.setSpeed(1, 0.5, 'FWD');

			const state = manager.getState(1);

			expect(state).toBeDefined();

			state!.speed = 1;
			state!.dir = 'REV';
			state!.fns[0] = false;

			expect(manager.getState(1)).toEqual({
				speed: 0.5,
				dir: 'FWD',
				fns: { 0: true },
				estop: false
			});
		});

		it('does not expose mutable state through getAllStates', () => {
			manager.setFunction(1, 0, true);
			manager.setSpeed(1, 0.5, 'FWD');

			const states = manager.getAllStates();
			const state = states.get(1);

			expect(state).toBeDefined();

			state!.speed = 1;
			state!.fns[0] = false;

			states.set(2, {
				speed: 0,
				dir: 'REV',
				fns: {},
				estop: false
			});

			expect(manager.getState(1)).toEqual({
				speed: 0.5,
				dir: 'FWD',
				fns: { 0: true },
				estop: false
			});

			expect(manager.getState(2)).toBeUndefined();
		});
	});

	describe('speed', () => {
		it.each([
			[-0.3, 0],
			[0, 0],
			[0.5, 0.5],
			[1, 1],
			[5, 1],
			[Number.NaN, 0],
			[Number.POSITIVE_INFINITY, 0],
			[Number.NEGATIVE_INFINITY, 0]
		])('normalizes speed %s to %s', (input, expected) => {
			const state = manager.setSpeed(2, input, 'FWD');

			expect(state.speed).toBe(expected);
		});

		it('updates direction while preserving functions', () => {
			manager.setFunction(7, 1, true);

			const state = manager.setSpeed(7, 0.2, 'REV');

			expect(state).toEqual({
				speed: 0.2,
				dir: 'REV',
				fns: { 1: true },
				estop: false
			});
		});

		it('returns an independent state copy', () => {
			const state = manager.setSpeed(3, 0.5, 'FWD');

			state.speed = 1;

			expect(manager.getState(3)?.speed).toBe(0.5);
		});
	});

	describe('functions', () => {
		it('sets a function and creates the locomotive if necessary', () => {
			const state = manager.setFunction(9, 3, true);

			expect(state).toEqual({
				speed: 0,
				dir: 'FWD',
				fns: { 3: true },
				estop: false
			});
		});

		it('updates an existing function', () => {
			manager.setFunction(9, 3, true);

			const state = manager.setFunction(9, 3, false);

			expect(state.fns[3]).toBe(false);
			expect(manager.getState(9)?.fns[3]).toBe(false);
		});

		it('preserves existing speed and direction', () => {
			manager.setSpeed(9, 0.6, 'REV');

			const state = manager.setFunction(9, 3, true);

			expect(state).toEqual({
				speed: 0.6,
				dir: 'REV',
				fns: { 3: true },
				estop: false
			});
		});

		it('returns an independent function map', () => {
			const state = manager.setFunction(9, 3, true);

			state.fns[3] = false;

			expect(manager.getState(9)?.fns[3]).toBe(true);
		});
	});

	describe('stopAll', () => {
		it('sets all locomotive speeds to zero', () => {
			manager.setSpeed(1, 0.4, 'FWD');
			manager.setFunction(1, 0, true);
			manager.setSpeed(2, 0.9, 'REV');

			const stopped = manager.stopAll();

			expect(stopped).toEqual([
				{
					addr: 1,
					state: {
						speed: 0,
						dir: 'FWD',
						fns: { 0: true },
						estop: false
					}
				},
				{
					addr: 2,
					state: {
						speed: 0,
						dir: 'REV',
						fns: {},
						estop: false
					}
				}
			]);

			expect(manager.getState(1)?.speed).toBe(0);
			expect(manager.getState(2)?.speed).toBe(0);
		});

		it('preserves emergency-stop state and functions', () => {
			manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 600,
					speed: 0.6,
					emergencyStop: true,
					functionMap: { 0: true }
				})
			);

			const [stopped] = manager.stopAll();

			expect(stopped.state).toEqual({
				speed: 0,
				dir: 'FWD',
				fns: { 0: true },
				estop: true
			});
		});

		it('returns independent state copies', () => {
			manager.setSpeed(1, 0.5, 'FWD');

			const [stopped] = manager.stopAll();
			stopped.state.speed = 1;

			expect(manager.getState(1)?.speed).toBe(0);
		});
	});

	describe('updateLocoInfoFromZ21', () => {
		it('creates a locomotive from received Z21 information', () => {
			const result = manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 200,
					speed: 0.3,
					direction: 'REV',
					functionMap: { 0: true, 5: false },
					speedSteps: 128,
					emergencyStop: true
				})
			);

			expect(result).toEqual({
				addr: 200,
				state: {
					speed: 0.3,
					dir: 'REV',
					fns: {
						0: true,
						5: false
					},
					estop: true
				}
			});

			expect(manager.getState(200)).toEqual(result.state);
		});

		it('replaces previously stored state with received Z21 information', () => {
			manager.setSpeed(50, 0.8, 'REV');
			manager.setFunction(50, 1, true);

			manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 50,
					speed: 0.2,
					direction: 'FWD',
					functionMap: { 5: true },
					emergencyStop: true
				})
			);

			expect(manager.getState(50)).toEqual({
				speed: 0.2,
				dir: 'FWD',
				fns: { 5: true },
				estop: true
			});
		});

		it('updates emergency-stop state from subsequent Z21 information', () => {
			manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 75,
					emergencyStop: true
				})
			);

			manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 75,
					speed: 0.7,
					emergencyStop: false
				})
			);

			expect(manager.getState(75)?.estop).toBe(false);
		});

		it('copies the received function map', () => {
			const functionMap = { 0: true };

			manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 75,
					functionMap
				})
			);

			functionMap[0] = false;

			expect(manager.getState(75)?.fns[0]).toBe(true);
		});

		it('returns an independent state copy', () => {
			const result = manager.updateLocoInfoFromZ21(
				makeZ21LocoInfo({
					addr: 75,
					functionMap: { 0: true }
				})
			);

			result.state.speed = 1;
			result.state.fns[0] = false;

			expect(manager.getState(75)).toEqual({
				speed: 0.5,
				dir: 'FWD',
				fns: { 0: true },
				estop: false
			});
		});
	});

	describe('subscribeLocoInfoOnce', () => {
		it('subscribes an address only once', () => {
			expect(manager.subscribeLocoInfoOnce(400)).toBe(true);
			expect(manager.subscribeLocoInfoOnce(400)).toBe(false);
		});

		it('ensures a locomotive state exists when subscribing', () => {
			manager.subscribeLocoInfoOnce(400);

			expect(manager.getState(400)).toEqual({
				speed: 0,
				dir: 'FWD',
				fns: {},
				estop: false
			});
		});

		it('tracks subscriptions independently by address', () => {
			expect(manager.subscribeLocoInfoOnce(400)).toBe(true);
			expect(manager.subscribeLocoInfoOnce(500)).toBe(true);
			expect(manager.subscribeLocoInfoOnce(400)).toBe(false);
			expect(manager.subscribeLocoInfoOnce(500)).toBe(false);
		});
	});
});
