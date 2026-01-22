/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21StatusEvent } from '@application-platform/z21-shared';

import { TrackStatusManager } from './track-status-manager';

describe('TrackStatusManager', () => {
	let manager: TrackStatusManager;

	beforeEach(() => {
		manager = new TrackStatusManager();
	});

	// Helper functions to create test data (similar to makeProviders in bootstrap.spec.ts)
	function makeCsStatusEvent(overrides: Partial<any> = {}): any {
		return {
			event: 'system.event.status' as const,
			payload: {
				powerOn: true,
				emergencyStop: false,
				shortCircuit: false,
				programmingMode: false,
				...overrides
			}
		} as Z21StatusEvent;
	}

	describe('basic state management', () => {
		it('returns  status initially', () => {
			const status = manager.getStatus();
			expect(status).toEqual({
				powerOn: false,
				emergencyStop: false,
				programmingMode: false,
				shortCircuit: false
			});
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
	});

	describe('setShortCircuit', () => {
		it('sets shortCircuit circuit to true with ds.x.bus source', () => {
			const status = manager.setShortCircuit(true, 'ds.x.bus');

			expect(status.shortCircuit).toBe(true);
			expect(status.source).toBe('ds.x.bus');
		});

		it('sets shortCircuit circuit to false with ds.lan.x source', () => {
			manager.setShortCircuit(true, 'ds.x.bus');
			const status = manager.setShortCircuit(false, 'ds.lan.x');

			expect(status.shortCircuit).toBe(false);
			expect(status.source).toBe('ds.lan.x');
		});

		it('preserves existing emergency stop status when setting shortCircuit circuit', () => {
			manager.setEmergencyStop(true, 'ds.x.bus');
			const status = manager.setShortCircuit(true, 'ds.lan.x');

			expect(status.emergencyStop).toBe(true);
			expect(status.shortCircuit).toBe(true);
		});

		it('handles undefined source parameter', () => {
			const status = manager.setShortCircuit(true, undefined);

			expect(status.shortCircuit).toBe(true);
			expect(status.source).toBeUndefined();
		});

		it('toggles shortCircuit circuit flag multiple times', () => {
			manager.setShortCircuit(true, 'ds.system.state');
			manager.setShortCircuit(false, 'ds.system.state');
			const status = manager.setShortCircuit(true, 'ds.system.state');

			expect(status.shortCircuit).toBe(true);
		});
	});
});
