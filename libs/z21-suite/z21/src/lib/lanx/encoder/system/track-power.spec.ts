/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { encodeLanXSetTrackPowerOff, encodeLanXSetTrackPowerOn } from './track-power';

describe('track-power encoding', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(
		buffer: Buffer,
		command: typeof LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF | typeof LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON
	): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
		expect(buffer[4]).toBe(command.xHeader);
		expect(buffer[5]).toBe(command.xBusCmd);
	}

	// Helper function to verify frame length
	function expectFrameLength(buffer: Buffer, expectedLength: number): void {
		expect(buffer.readUInt16LE(0)).toBe(expectedLength);
		expect(buffer.length).toBe(expectedLength);
	}

	describe('encodeLanXSetTrackPowerOff', () => {
		describe('frame structure', () => {
			it('returns a buffer', () => {
				const result = encodeLanXSetTrackPowerOff();

				expect(Buffer.isBuffer(result)).toBe(true);
			});

			it('includes correct LAN_X header and TRACK_POWER_OFF command', () => {
				const result = encodeLanXSetTrackPowerOff();

				expectValidLanXFrame(result, LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF);
			});

			it('includes valid xor checksum', () => {
				const result = encodeLanXSetTrackPowerOff();

				expectValidXor(result);
			});

			it('encodes correct message length', () => {
				const result = encodeLanXSetTrackPowerOff();

				expectFrameLength(result, 7); // len(2) + header(2) + xHeader(1) + xBusCmd(1) + xor(1)
			});
		});

		describe('consistency', () => {
			it('produces consistent output for multiple calls', () => {
				const result1 = encodeLanXSetTrackPowerOff();
				const result2 = encodeLanXSetTrackPowerOff();

				expect(result1).toEqual(result2);
			});

			it('produces independent buffers', () => {
				const result1 = encodeLanXSetTrackPowerOff();
				const result2 = encodeLanXSetTrackPowerOff();

				expect(result1).not.toBe(result2); // Different buffer instances
				expect(result1.equals(result2)).toBe(true); // But same content
			});
		});

		describe('command differentiation', () => {
			it('returns different result than power on command', () => {
				const off = encodeLanXSetTrackPowerOff();
				const on = encodeLanXSetTrackPowerOn();

				expect(off).not.toEqual(on);
			});

			it('encodes different xBusCmd than power on', () => {
				const off = encodeLanXSetTrackPowerOff();
				const on = encodeLanXSetTrackPowerOn();

				expect(off[5]).not.toBe(on[5]);
			});
		});
	});

	describe('encodeLanXSetTrackPowerOn', () => {
		describe('frame structure', () => {
			it('returns a buffer', () => {
				const result = encodeLanXSetTrackPowerOn();

				expect(Buffer.isBuffer(result)).toBe(true);
			});

			it('includes correct LAN_X header and TRACK_POWER_ON command', () => {
				const result = encodeLanXSetTrackPowerOn();

				expectValidLanXFrame(result, LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON);
			});

			it('includes valid xor checksum', () => {
				const result = encodeLanXSetTrackPowerOn();

				expectValidXor(result);
			});

			it('encodes correct message length', () => {
				const result = encodeLanXSetTrackPowerOn();

				expectFrameLength(result, 7); // len(2) + header(2) + xHeader(1) + xBusCmd(1) + xor(1)
			});
		});

		describe('consistency', () => {
			it('produces consistent output for multiple calls', () => {
				const result1 = encodeLanXSetTrackPowerOn();
				const result2 = encodeLanXSetTrackPowerOn();

				expect(result1).toEqual(result2);
			});

			it('produces independent buffers', () => {
				const result1 = encodeLanXSetTrackPowerOn();
				const result2 = encodeLanXSetTrackPowerOn();

				expect(result1).not.toBe(result2); // Different buffer instances
				expect(result1.equals(result2)).toBe(true); // But same content
			});
		});

		describe('command differentiation', () => {
			it('returns different result than power off command', () => {
				const on = encodeLanXSetTrackPowerOn();
				const off = encodeLanXSetTrackPowerOff();

				expect(on).not.toEqual(off);
			});

			it('encodes different xBusCmd than power off', () => {
				const on = encodeLanXSetTrackPowerOn();
				const off = encodeLanXSetTrackPowerOff();

				expect(on[5]).not.toBe(off[5]);
			});
		});
	});

	describe('UDP transmission readiness', () => {
		it('power off command is suitable for sending over UDP', () => {
			const result = encodeLanXSetTrackPowerOff();

			expect(result.length).toBeLessThanOrEqual(255); // UDP max payload
			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('power on command is suitable for sending over UDP', () => {
			const result = encodeLanXSetTrackPowerOn();

			expect(result.length).toBeLessThanOrEqual(255); // UDP max payload
			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('both commands create valid LAN_X formatted messages', () => {
			const off = encodeLanXSetTrackPowerOff();
			const on = encodeLanXSetTrackPowerOn();

			expect(off.readUInt16LE(0)).toBe(off.length);
			expect(on.readUInt16LE(0)).toBe(on.length);

			expect(off.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
			expect(on.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
		});
	});
});
