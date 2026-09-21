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

	describe('initial state', () => {
		it('returns the initial track status', () => {
			expect(manager.getStatus()).toEqual({
				powerOn: false,
				emergencyStop: false,
				programmingMode: false,
				shortCircuit: false
			});
		});

		it('returns a copy of the current status', () => {
			const status = manager.getStatus();

			status.powerOn = true;

			expect(manager.getStatus().powerOn).toBe(false);
		});
	});

	describe('updateStatus', () => {
		it('replaces all track status flags and stores the source', () => {
			const status = manager.updateStatus(
				{
					powerOn: true,
					emergencyStop: false,
					programmingMode: true,
					shortCircuit: false
				},
				'ds.system.state'
			);

			expect(status).toEqual({
				powerOn: true,
				emergencyStop: false,
				programmingMode: true,
				shortCircuit: false,
				source: 'ds.system.state'
			});
		});

		it('replaces a previously stored status completely', () => {
			manager.updateStatus(
				{
					powerOn: true,
					emergencyStop: true,
					programmingMode: true,
					shortCircuit: true
				},
				'ds.system.state'
			);

			const status = manager.updateStatus(
				{
					powerOn: false,
					emergencyStop: false,
					programmingMode: false,
					shortCircuit: false
				},
				'ds.x.bus'
			);

			expect(status).toEqual({
				powerOn: false,
				emergencyStop: false,
				programmingMode: false,
				shortCircuit: false,
				source: 'ds.x.bus'
			});
		});

		it('returns a copy of the updated status', () => {
			const status = manager.updateStatus(
				{
					powerOn: true,
					emergencyStop: false,
					programmingMode: false,
					shortCircuit: false
				},
				'ds.x.bus'
			);

			status.powerOn = false;

			expect(manager.getStatus().powerOn).toBe(true);
		});
	});

	describe('setEmergencyStop', () => {
		it('updates emergency stop and source', () => {
			const status = manager.setEmergencyStop(true, 'ds.lan.x');

			expect(status.emergencyStop).toBe(true);
			expect(status.source).toBe('ds.lan.x');
		});

		it('preserves the remaining track status', () => {
			manager.updateStatus(
				{
					powerOn: true,
					emergencyStop: false,
					programmingMode: true,
					shortCircuit: true
				},
				'ds.system.state'
			);

			const status = manager.setEmergencyStop(true, 'ds.lan.x');

			expect(status).toEqual({
				powerOn: true,
				emergencyStop: true,
				programmingMode: true,
				shortCircuit: true,
				source: 'ds.lan.x'
			});
		});

		it('can clear emergency stop', () => {
			manager.setEmergencyStop(true, 'ds.lan.x');

			const status = manager.setEmergencyStop(false, 'ds.x.bus');

			expect(status.emergencyStop).toBe(false);
			expect(status.source).toBe('ds.x.bus');
		});
	});

	describe('setShortCircuit', () => {
		it('updates short-circuit state and source', () => {
			const status = manager.setShortCircuit(true, 'ds.x.bus');

			expect(status.shortCircuit).toBe(true);
			expect(status.source).toBe('ds.x.bus');
		});

		it('preserves the remaining track status', () => {
			manager.updateStatus(
				{
					powerOn: true,
					emergencyStop: true,
					programmingMode: true,
					shortCircuit: false
				},
				'ds.system.state'
			);

			const status = manager.setShortCircuit(true, 'ds.lan.x');

			expect(status).toEqual({
				powerOn: true,
				emergencyStop: true,
				programmingMode: true,
				shortCircuit: true,
				source: 'ds.lan.x'
			});
		});

		it('can clear short-circuit state', () => {
			manager.setShortCircuit(true, 'ds.x.bus');

			const status = manager.setShortCircuit(false, 'ds.system.state');

			expect(status.shortCircuit).toBe(false);
			expect(status.source).toBe('ds.system.state');
		});
	});
});
