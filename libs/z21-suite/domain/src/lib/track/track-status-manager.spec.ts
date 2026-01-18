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

	it('updates system state flags', () => {
		const status = manager.updateFromSystemState({ powerOn: true, emergencyStop: false, short: false, source: 'ds.system.state' });
		expect(status.powerOn).toBe(true);
		expect(status.emergencyStop).toBe(false);
		expect(status.short).toBe(false);
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

	describe('updateFromLanX', () => {
		it('updates track status from event.z21.status event and marks source as lan.x', () => {
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: true, emergencyStop: false, shortCircuit: false, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(false);
			expect(status.short).toBe(false);
			expect(status.source).toBe('ds.lan.x');
		});

		it('sets power off when event.z21.status reports power off', () => {
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: false, emergencyStop: false, shortCircuit: false, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.powerOn).toBe(false);
		});

		it('preserves current power state when emergency stop is active', () => {
			manager.updateFromXbusPower(true);
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: false, emergencyStop: true, shortCircuit: false, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(true);
		});

		it('uses event.z21.status power when emergency stop is not active', () => {
			manager.updateFromXbusPower(true);
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: false, emergencyStop: false, shortCircuit: false, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.powerOn).toBe(false);
		});

		it('updates short circuit flag from event.z21.status', () => {
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: true, emergencyStop: false, shortCircuit: true, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.short).toBe(true);
		});

		it('clears short circuit flag when event.z21.status reports no short', () => {
			manager.updateFromSystemState({ short: true });
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: true, emergencyStop: false, shortCircuit: false, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.short).toBe(false);
		});

		it('handles emergency stop with undefined previous power state', () => {
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: false, emergencyStop: true, shortCircuit: false, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.emergencyStop).toBe(true);
			expect(status.powerOn).toBeUndefined();
		});

		it('preserves undefined power state when emergency stop is active and no prior state', () => {
			const z21StatusEvent = {
				type: 'event.z21.status' as const,
				payload: { powerOn: true, emergencyStop: true, shortCircuit: true, programmingMode: false }
			};
			const status = manager.updateFromLanX(z21StatusEvent);

			expect(status.powerOn).toBeUndefined();
			expect(status.emergencyStop).toBe(true);
			expect(status.short).toBe(true);
		});
	});

	describe('setEmergencyStop', () => {
		it('sets emergency stop to true with x.bus source', () => {
			const status = manager.setEmergencyStop(true, 'ds.x.bus');

			expect(status.emergencyStop).toBe(true);
			expect(status.source).toBe('ds.x.bus');
		});

		it('sets emergency stop to false with lan.x source', () => {
			manager.setEmergencyStop(true, 'ds.x.bus');
			const status = manager.setEmergencyStop(false, 'ds.lan.x');

			expect(status.emergencyStop).toBe(false);
			expect(status.source).toBe('ds.lan.x');
		});

		it('preserves existing power status when setting emergency stop', () => {
			manager.updateFromXbusPower(true);
			const status = manager.setEmergencyStop(true, 'ds.system.state');

			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(true);
		});

		it('preserves existing short status when setting emergency stop', () => {
			manager.updateFromSystemState({ short: true });
			const status = manager.setEmergencyStop(true, 'ds.lan.x');

			expect(status.short).toBe(true);
			expect(status.emergencyStop).toBe(true);
		});

		it('handles undefined source parameter', () => {
			const status = manager.setEmergencyStop(true, undefined);

			expect(status.emergencyStop).toBe(true);
			expect(status.source).toBeUndefined();
		});

		it('toggles emergency stop flag multiple times', () => {
			manager.setEmergencyStop(true, 'ds.x.bus');
			manager.setEmergencyStop(false, 'ds.x.bus');
			const status = manager.setEmergencyStop(true, 'ds.x.bus');

			expect(status.emergencyStop).toBe(true);
		});

		it('overwrites previous source when setting emergency stop', () => {
			manager.updateFromSystemState({ powerOn: true, source: 'ds.system.state' });
			const status = manager.setEmergencyStop(true, 'ds.lan.x');

			expect(status.source).toBe('ds.lan.x');
		});
	});
});
