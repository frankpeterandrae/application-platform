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

	// Helper functions to create test data (similar to makeProviders in bootstrap.spec.ts)
	function makeCsStatusEvent(overrides: Partial<any> = {}): any {
		return {
			type: 'event.z21.status' as const,
			payload: {
				powerOn: true,
				emergencyStop: false,
				shortCircuit: false,
				programmingMode: false,
				...overrides
			}
		};
	}

	function makeSystemStateUpdate(overrides: Partial<any> = {}): any {
		return {
			powerOn: undefined,
			emergencyStop: undefined,
			short: undefined,
			source: undefined,
			...overrides
		};
	}

	describe('basic state management', () => {
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
	});

	describe('X-Bus power updates', () => {
		it('sets power on via X-Bus and marks source as ds.x.bus', () => {
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
	});

	describe('system state updates', () => {
		it('updates system state flags', () => {
			const status = manager.updateFromSystemState(
				makeSystemStateUpdate({ powerOn: true, emergencyStop: false, short: false, source: 'ds.system.state' })
			);
			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(false);
			expect(status.short).toBe(false);
			expect(status.source).toBe('ds.system.state');
		});

		it('updates emergencyStop flag from system state', () => {
			const status = manager.updateFromSystemState(makeSystemStateUpdate({ emergencyStop: true }));
			expect(status.emergencyStop).toBe(true);
		});

		it('updates short flag from system state', () => {
			const status = manager.updateFromSystemState(makeSystemStateUpdate({ short: true }));
			expect(status.short).toBe(true);
		});

		it('clears emergencyStop when system state sets it to false', () => {
			manager.updateFromSystemState(makeSystemStateUpdate({ emergencyStop: true }));
			const status = manager.updateFromSystemState(makeSystemStateUpdate({ emergencyStop: false }));
			expect(status.emergencyStop).toBe(false);
		});

		it('handles partial system state updates with undefined fields', () => {
			const status = manager.updateFromSystemState(makeSystemStateUpdate({ short: true }));
			expect(status.short).toBe(true);
			expect(status.powerOn).toBeUndefined();
			expect(status.emergencyStop).toBeUndefined();
		});
	});

	describe('updateFromLanX', () => {
		it('updates track status from z21.status event and marks source as ds.lan.x', () => {
			const csStatusEvent = makeCsStatusEvent();
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(false);
			expect(status.short).toBe(false);
			expect(status.source).toBe('ds.lan.x');
		});

		it('sets power off when z21.status reports power off', () => {
			const csStatusEvent = makeCsStatusEvent({ powerOn: false });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.powerOn).toBe(false);
		});

		it('preserves current power state when emergency stop is active', () => {
			manager.updateFromXbusPower(true);
			const csStatusEvent = makeCsStatusEvent({ powerOn: false, emergencyStop: true });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(true);
		});

		it('uses z21.status power when emergency stop is not active', () => {
			manager.updateFromXbusPower(true);
			const csStatusEvent = makeCsStatusEvent({ powerOn: false });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.powerOn).toBe(false);
		});

		it('updates short circuit flag from z21.status', () => {
			const csStatusEvent = makeCsStatusEvent({ shortCircuit: true });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.short).toBe(true);
		});

		it('clears short circuit flag when z21.status reports no short', () => {
			manager.updateFromSystemState(makeSystemStateUpdate({ short: true }));
			const csStatusEvent = makeCsStatusEvent({ shortCircuit: false });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.short).toBe(false);
		});

		it('handles emergency stop with undefined previous power state', () => {
			const csStatusEvent = makeCsStatusEvent({ powerOn: false, emergencyStop: true });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.emergencyStop).toBe(true);
			expect(status.powerOn).toBeUndefined();
		});

		it('preserves undefined power state when emergency stop is active and no prior state', () => {
			const csStatusEvent = makeCsStatusEvent({ powerOn: true, emergencyStop: true, shortCircuit: true });
			const status = manager.updateFromLanX(csStatusEvent);

			expect(status.powerOn).toBeUndefined();
			expect(status.emergencyStop).toBe(true);
			expect(status.short).toBe(true);
		});
	});

	describe('setEmergencyStop', () => {
		it('sets emergency stop to true with ds.x.bus source', () => {
			const status = manager.setEmergencyStop(true, 'ds.x.bus');

			expect(status.emergencyStop).toBe(true);
			expect(status.source).toBe('ds.x.bus');
		});

		it('sets emergency stop to false with ds.lan.x source', () => {
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
			manager.updateFromSystemState(makeSystemStateUpdate({ short: true }));
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
			manager.updateFromSystemState(makeSystemStateUpdate({ powerOn: true, source: 'ds.system.state' }));
			const status = manager.setEmergencyStop(true, 'ds.lan.x');

			expect(status.source).toBe('ds.lan.x');
		});
	});

	describe('setShortCircuit', () => {
		it('sets short circuit to true with ds.x.bus source', () => {
			const status = manager.setShortCircuit(true, 'ds.x.bus');

			expect(status.short).toBe(true);
			expect(status.source).toBe('ds.x.bus');
		});

		it('sets short circuit to false with ds.lan.x source', () => {
			manager.setShortCircuit(true, 'ds.x.bus');
			const status = manager.setShortCircuit(false, 'ds.lan.x');

			expect(status.short).toBe(false);
			expect(status.source).toBe('ds.lan.x');
		});

		it('preserves existing power status when setting short circuit', () => {
			manager.updateFromXbusPower(true);
			const status = manager.setShortCircuit(true, 'ds.system.state');

			expect(status.powerOn).toBe(true);
			expect(status.short).toBe(true);
		});

		it('preserves existing emergency stop status when setting short circuit', () => {
			manager.setEmergencyStop(true, 'ds.x.bus');
			const status = manager.setShortCircuit(true, 'ds.lan.x');

			expect(status.emergencyStop).toBe(true);
			expect(status.short).toBe(true);
		});

		it('handles undefined source parameter', () => {
			const status = manager.setShortCircuit(true, undefined);

			expect(status.short).toBe(true);
			expect(status.source).toBeUndefined();
		});

		it('toggles short circuit flag multiple times', () => {
			manager.setShortCircuit(true, 'ds.system.state');
			manager.setShortCircuit(false, 'ds.system.state');
			const status = manager.setShortCircuit(true, 'ds.system.state');

			expect(status.short).toBe(true);
		});

		it('overwrites previous source when setting short circuit', () => {
			manager.updateFromSystemState(makeSystemStateUpdate({ powerOn: true, source: 'ds.system.state' }));
			const status = manager.setShortCircuit(true, 'ds.lan.x');

			expect(status.source).toBe('ds.lan.x');
		});

		it('combines with existing state from different sources', () => {
			manager.updateFromXbusPower(true); // source: ds.x.bus, powerOn: true
			manager.setEmergencyStop(true, 'ds.lan.x'); // source: ds.lan.x, emergencyStop: true
			const status = manager.setShortCircuit(true, 'ds.system.state'); // source: ds.system.state, short: true

			expect(status.powerOn).toBe(true);
			expect(status.emergencyStop).toBe(true);
			expect(status.short).toBe(true);
			expect(status.source).toBe('ds.system.state');
		});
	});
});
