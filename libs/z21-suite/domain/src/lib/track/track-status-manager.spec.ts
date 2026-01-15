/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TrackStatusManager } from './track-status-manager';

describe('TrackStatusManager', () => {
	let manager: TrackStatusManager;

	beforeEach(() => {
		manager = new TrackStatusManager();
	});

	it('returns empty status initially', () => {
		const status = manager.getStatus();
		expect(status).toEqual({});
	});

	it('returns a copy of status preventing external mutation', () => {
		manager.updateFromXbusPower(true);
		const status1 = manager.getStatus();
		status1.powerOn = false;
		const status2 = manager.getStatus();
		expect(status2.powerOn).toBe(true);
	});

	it('sets power on via X-Bus and marks source as x.bus', () => {
		const status = manager.updateFromXbusPower(true);
		expect(status.powerOn).toBe(true);
		expect(status.source).toBe('ds.x.bus');
	});

	it('sets power off via X-Bus', () => {
		manager.updateFromXbusPower(true);
		const status = manager.updateFromXbusPower(false);
		expect(status.powerOn).toBe(false);
		expect(status.source).toBe('ds.x.bus');
	});

	it('updates system state flags when no prior X-Bus power is set', () => {
		const status = manager.updateFromSystemState({ powerOn: true, emergencyStop: false, short: false });
		expect(status.powerOn).toBe(true);
		expect(status.emergencyStop).toBe(false);
		expect(status.short).toBe(false);
		expect(status.source).toBe('ds.system.state');
	});

	it('preserves X-Bus power when system state updates arrive', () => {
		manager.updateFromXbusPower(true);
		const status = manager.updateFromSystemState({ powerOn: false, emergencyStop: false, short: false });
		expect(status.powerOn).toBe(true);
		expect(status.source).toBe('ds.x.bus');
	});

	it('uses system state power when X-Bus has no prior powerOn value', () => {
		manager.updateFromSystemState({ powerOn: true, emergencyStop: false, short: false });
		const status = manager.updateFromSystemState({ powerOn: false, emergencyStop: false, short: false });
		expect(status.powerOn).toBe(false);
		expect(status.source).toBe('ds.system.state');
	});

	it('updates emergencyStop flag from system state', () => {
		const status = manager.updateFromSystemState({ emergencyStop: true });
		expect(status.emergencyStop).toBe(true);
	});

	it('updates short flag from system state', () => {
		const status = manager.updateFromSystemState({ short: true });
		expect(status.short).toBe(true);
	});

	it('clears emergencyStop when system state sets it to false', () => {
		manager.updateFromSystemState({ emergencyStop: true });
		const status = manager.updateFromSystemState({ emergencyStop: false });
		expect(status.emergencyStop).toBe(false);
	});

	it('handles partial system state updates with undefined fields', () => {
		const status = manager.updateFromSystemState({ short: true });
		expect(status.short).toBe(true);
		expect(status.powerOn).toBeUndefined();
		expect(status.emergencyStop).toBeUndefined();
	});

	it('combines X-Bus power with system state short and emergencyStop', () => {
		manager.updateFromXbusPower(true);
		const status = manager.updateFromSystemState({ short: true, emergencyStop: false });
		expect(status.powerOn).toBe(true);
		expect(status.short).toBe(true);
		expect(status.emergencyStop).toBe(false);
		expect(status.source).toBe('ds.x.bus');
	});

	it('preserves X-Bus source after system state update', () => {
		manager.updateFromXbusPower(false);
		manager.updateFromSystemState({ powerOn: true });
		const status = manager.getStatus();
		expect(status.source).toBe('ds.x.bus');
	});

	it('sets source to system.state when no X-Bus update has occurred', () => {
		const status = manager.updateFromSystemState({ powerOn: true });
		expect(status.source).toBe('ds.system.state');
	});
});
