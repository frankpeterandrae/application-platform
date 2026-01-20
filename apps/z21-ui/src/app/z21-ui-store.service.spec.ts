/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LocoState, SystemTrackPower, TurnoutState_Message } from '@application-platform/protocol';
import { beforeEach, describe, expect, it } from 'vitest';

import { Z21UiStore } from './z21-ui-store.service';

describe('Z21UiStore', () => {
	let store: Z21UiStore;

	beforeEach(() => {
		store = new Z21UiStore();
	});

	it('updates powerOn when receiving system.message.trackpower messages', () => {
		expect(store.powerOn()).toBe(false);

		store.updateFromServer({ type: 'system.message.trackpower', payload: { on: true } } as SystemTrackPower);
		expect(store.powerOn()).toBe(true);

		store.updateFromServer({ type: 'system.message.trackpower', payload: { on: false } } as SystemTrackPower);
		expect(store.powerOn()).toBe(false);
	});

	it('applies loco state to ui when addr matches selectedAddr and not dragging', () => {
		// default selectedAddr is 1845
		expect(store.selectedAddr()).toBe(1845);
		expect(store.draggingSpeed()).toBe(false);

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: 1845, speed: 63, dir: 'REV', fns: { 0: true, 3: false }, estop: false }
		} as LocoState);

		expect(store.speedUi()).toBeCloseTo(63 / 126);
		expect(store.dir()).toBe('REV');
		expect(store.functions()).toEqual({ 0: true, 3: false });
	});

	it('does not apply loco state when addr does not match selectedAddr', () => {
		const beforeSpeed = store.speedUi();
		const beforeDir = store.dir();
		const beforeFns = store.functions();

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: 9999, speed: 126, dir: 'REV', fns: { 1: true }, estop: false }
		} as LocoState);

		expect(store.speedUi()).toBe(beforeSpeed);
		expect(store.dir()).toBe(beforeDir);
		expect(store.functions()).toEqual(beforeFns);
	});

	it('ignores loco updates when draggingSpeed is true', () => {
		store.draggingSpeed.set(true);

		const beforeSpeed = store.speedUi();
		const beforeDir = store.dir();

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: 100, dir: 'REV', fns: { 2: true }, estop: false }
		} as LocoState);

		expect(store.speedUi()).toBe(beforeSpeed);
		expect(store.dir()).toBe(beforeDir);
	});

	it('converts step values to ui speed and clamps extremes correctly', () => {
		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: 0, dir: 'FWD', fns: {}, estop: false }
		} as LocoState);
		expect(store.speedUi()).toBe(0);

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: 126, dir: 'FWD', fns: {}, estop: false }
		} as LocoState);
		expect(store.speedUi()).toBeCloseTo(1);

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: 200, dir: 'FWD', fns: {}, estop: false }
		} as LocoState);
		expect(store.speedUi()).toBeCloseTo(1);

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: -10, dir: 'FWD', fns: {}, estop: false }
		} as LocoState);
		expect(store.speedUi()).toBe(0);
	});

	it('replaces functions mapping when a loco state message is received', () => {
		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: 10, dir: 'FWD', fns: { 1: true }, estop: false }
		} as LocoState);
		expect(store.functions()).toEqual({ 1: true });

		store.updateFromServer({
			type: 'loco.message.state',
			payload: { addr: store.selectedAddr(), speed: 20, dir: 'FWD', fns: { 2: false }, estop: false }
		} as LocoState);
		expect(store.functions()).toEqual({ 2: false });
	});

	it('ignores switching.message.turnout.state messages without side effects', () => {
		const before = {
			powerOn: store.powerOn(),
			selectedAddr: store.selectedAddr(),
			speedUi: store.speedUi(),
			dir: store.dir(),
			functions: store.functions(),
			turnoutAddr: store.turnoutAddr()
		};

		store.updateFromServer({ type: 'switching.message.turnout.state', payload: { addr: 12, state: 'THROWN' } } as TurnoutState_Message);

		expect(store.powerOn()).toBe(before.powerOn);
		expect(store.selectedAddr()).toBe(before.selectedAddr);
		expect(store.speedUi()).toBe(before.speedUi);
		expect(store.dir()).toBe(before.dir);
		expect(store.functions()).toEqual(before.functions);
		expect(store.turnoutAddr()).toBe(before.turnoutAddr);
	});
});
