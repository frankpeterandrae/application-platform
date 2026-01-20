/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TrackPowerEvent } from './track-power-event';
import type { Z21CodeEvent } from './z21-code-event';
import type { Z21FirmwareVersionEvent } from './z21-firmware-version-event';
import type { Z21HwinfoEvent } from './z21-hwinfo-event';
import type { Z21StatusEvent } from './z21-status-event';
import type { Z21StoppedEvent } from './z21-stopped-event';
import type { Z21VersionEvent } from './z21-version-event';

describe('Z21 Event Types', () => {
	describe('Z21CodeEvent', () => {
		it('accepts command station code event', () => {
			const event: Z21CodeEvent = {
				type: 'event.z21.code',
				code: 2,
				raw: []
			};
			expect(event.type).toBe('event.z21.code');
			expect(event.code).toBe(2);
		});
	});

	describe('Z21FirmwareVersionEvent', () => {
		it('accepts firmware version event', () => {
			const event: Z21FirmwareVersionEvent = {
				type: 'event.z21.firmware.version',
				major: 1,
				minor: 43,
				raw: []
			};
			expect(event.major).toBe(1);
			expect(event.minor).toBe(43);
		});
	});

	describe('Z21HwinfoEvent', () => {
		it('accepts hardware info event', () => {
			const event: Z21HwinfoEvent = {
				type: 'event.z21.hwinfo',
				payload: {
					hardwareType: 'z21_START',
					majorVersion: 1,
					minorVersion: 43
				},
				raw: []
			};
			expect(event.payload.hardwareType).toBe('z21_START');
			expect(event.payload.majorVersion).toBe(1);
		});
	});

	describe('Z21StatusEvent', () => {
		it('accepts command station status with all fields', () => {
			const event: Z21StatusEvent = {
				type: 'event.z21.status',
				payload: {
					powerOn: true,
					emergencyStop: false,
					shortCircuit: false,
					programmingMode: false
				}
			};
			expect(event.payload.powerOn).toBe(true);
			expect(event.payload.emergencyStop).toBe(false);
		});

		it('accepts partial status', () => {
			const event: Z21StatusEvent = {
				type: 'event.z21.status',
				payload: {
					emergencyStop: true
				}
			};
			expect(event.payload.emergencyStop).toBe(true);
		});
	});

	describe('Z21StoppedEvent', () => {
		it('accepts command station stopped event', () => {
			const event: Z21StoppedEvent = {
				type: 'event.z21.stopped'
			};
			expect(event.type).toBe('event.z21.stopped');
		});
	});

	describe('Z21VersionEvent', () => {
		it('accepts X-Bus version event', () => {
			const event: Z21VersionEvent = {
				type: 'event.z21.x.bus.version',
				xBusVersion: 1.9,
				xBusVersionString: '1.9',
				cmdsId: 0x12,
				raw: []
			};
			expect(event.xBusVersion).toBe(1.9);
			expect(event.cmdsId).toBe(0x12);
		});
	});

	describe('TrackPowerEvent', () => {
		it('accepts track power on', () => {
			const event: TrackPowerEvent = {
				type: 'event.track.power',
				on: true
			};
			expect(event.on).toBe(true);
		});

		it('accepts track power off', () => {
			const event: TrackPowerEvent = {
				type: 'event.track.power',
				on: false
			};
			expect(event.on).toBe(false);
		});
	});
});
