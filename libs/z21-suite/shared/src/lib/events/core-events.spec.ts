/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TrackPowerEvent } from './system/track-power-event';
import type { Z21CodeEvent } from './system/z21-code-event';
import type { Z21FirmwareVersionEvent } from './system/z21-firmware-version-event';
import type { Z21HwinfoEvent } from './system/z21-hwinfo-event';
import type { Z21StatusEvent } from './system/z21-status-event';
import type { Z21StoppedEvent } from './system/z21-stopped-event';
import type { Z21VersionEvent } from './system/z21-version-event';

describe('Z21 Event Types', () => {
	describe('Z21CodeEvent', () => {
		it('accepts command station code event', () => {
			const event: Z21CodeEvent = {
				event: 'system.event.z21.code',
				payload: { code: 2, raw: [] }
			};
			expect(event.event).toBe('system.event.z21.code');
			expect(event.payload.code).toBe(2);
		});
	});

	describe('Z21FirmwareVersionEvent', () => {
		it('accepts firmware version event', () => {
			const event: Z21FirmwareVersionEvent = {
				event: 'system.event.firmware.version',
				payload: {
					major: 1,
					minor: 43,
					raw: []
				}
			};
			expect(event.payload.major).toBe(1);
			expect(event.payload.minor).toBe(43);
		});
	});

	describe('Z21HwinfoEvent', () => {
		it('accepts hardware info event', () => {
			const event: Z21HwinfoEvent = {
				event: 'system.event.hwinfo',
				payload: {
					hardwareType: 'z21_START',
					majorVersion: 1,
					minorVersion: 43,
					raw: []
				}
			};
			expect(event.payload.hardwareType).toBe('z21_START');
			expect(event.payload.majorVersion).toBe(1);
		});
	});

	describe('Z21StatusEvent', () => {
		it('accepts command station status with all fields', () => {
			const event: Z21StatusEvent = {
				event: 'system.event.status',
				payload: {
					powerOn: true,
					emergencyStop: false,
					shortCircuit: false,
					programmingMode: false,
					raw: []
				}
			};
			expect(event.payload.powerOn).toBe(true);
			expect(event.payload.emergencyStop).toBe(false);
		});

		it('accepts partial status', () => {
			const event: Z21StatusEvent = {
				event: 'system.event.status',
				payload: {
					emergencyStop: true,
					powerOn: false,
					programmingMode: false,
					shortCircuit: false,
					raw: []
				}
			};
			expect(event.payload.emergencyStop).toBe(true);
		});
	});

	describe('Z21StoppedEvent', () => {
		it('accepts command station stopped event', () => {
			const event: Z21StoppedEvent = {
				event: 'system.event.stopped',
				payload: { raw: [] }
			};
			expect(event.event).toBe('system.event.stopped');
		});
	});

	describe('Z21VersionEvent', () => {
		it('accepts X-Bus version event', () => {
			const event: Z21VersionEvent = {
				event: 'system.event.x.bus.version',
				payload: {
					xBusVersion: 1.9,
					xBusVersionString: '1.9',
					cmdsId: 0x12,
					raw: []
				}
			};
			expect(event.payload.xBusVersion).toBe(1.9);
			expect(event.payload.cmdsId).toBe(0x12);
		});
	});

	describe('TrackPowerEvent', () => {
		it('accepts track power on', () => {
			const event: TrackPowerEvent = {
				event: 'system.event.track.power',
				payload: {
					powerOn: true,
					emergencyStop: false,
					shortCircuit: false,
					programmingMode: false,
					raw: []
				}
			};
			expect(event.payload.powerOn).toBe(true);
		});

		it('accepts track power off', () => {
			const event: TrackPowerEvent = {
				event: 'system.event.track.power',
				payload: {
					powerOn: false,
					emergencyStop: false,
					shortCircuit: false,
					programmingMode: false,
					raw: []
				}
			};
			expect(event.payload.powerOn).toBe(false);
		});
	});
});
