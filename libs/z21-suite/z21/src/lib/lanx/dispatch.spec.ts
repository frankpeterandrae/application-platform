/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LanXCommandKey, XBusCmd, XHeader, Z21LanHeader } from '@application-platform/z21-shared';

import { resolveLanXCommand } from './dispatch';

describe('resolveLanXCommand', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to verify command resolution
	function expectCommandResolution(xBusHeader: XHeader, data: Uint8Array, expectedCommand: LanXCommandKey): void {
		const result = resolveLanXCommand(xBusHeader, data);
		expect(result).toBe(expectedCommand);
	}

	// Helper function to verify unknown command
	function expectUnknownCommand(xBusHeader: XHeader, data: Uint8Array): void {
		expectCommandResolution(xBusHeader, data, 'LAN_X_UNKNOWN_COMMAND');
	}

	describe('turnout info commands', () => {
		it('returns LAN_X_GET_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is 1', () => {
			const data = makePayload(0x01);

			expectCommandResolution(XHeader.TURNOUT_INFO, data, 'LAN_X_GET_TURNOUT_INFO');
		});

		it('returns LAN_X_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is 2', () => {
			const data = makePayload(0x01, 0x02);

			expectCommandResolution(XHeader.TURNOUT_INFO, data, 'LAN_X_TURNOUT_INFO');
		});

		it('returns LAN_X_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is greater than 2', () => {
			const data = makePayload(Z21LanHeader.LAN_X, XHeader.TURNOUT_INFO, 0x01, 0x02, 0x03, 0x04);

			expectCommandResolution(XHeader.TURNOUT_INFO, data, 'LAN_X_TURNOUT_INFO');
		});

		it('returns LAN_X_UNKNOWN_COMMAND when xHeader is TURNOUT_INFO and length is 0', () => {
			const data = makePayload();

			expectUnknownCommand(XHeader.TURNOUT_INFO, data);
		});
	});

	describe('broadcast commands', () => {
		it('returns correct command for BROADCAST header with TRACK_POWER_ON', () => {
			const data = makePayload(XBusCmd.BC_TRACK_POWER_ON, 0x01);

			expectCommandResolution(XHeader.BROADCAST, data, 'LAN_X_BC_TRACK_POWER_ON');
		});

		it('returns LAN_X_UNKNOWN_COMMAND when BROADCAST data is empty', () => {
			const data = makePayload();

			expectUnknownCommand(XHeader.BROADCAST, data);
		});
	});

	describe('empty data handling', () => {
		it('returns LAN_X_UNKNOWN_COMMAND for headers that require data when data is empty', () => {
			const headersRequiringData = [XHeader.TURNOUT_INFO, XHeader.BROADCAST];

			for (const header of headersRequiringData) {
				expectUnknownCommand(header, makePayload());
			}
		});

		it('returns valid command for headers that do not require xBusCmd when data is empty', () => {
			// LOCO_INFO_ANSWER does not require xBusCmd, so empty data is valid
			expectCommandResolution(XHeader.LOCO_INFO_ANSWER, makePayload(), 'LAN_X_LOCO_INFO');
		});
	});

	describe('command resolution consistency', () => {
		it('resolves same command for same input consistently', () => {
			const data = makePayload(0x01);

			const result1 = resolveLanXCommand(XHeader.TURNOUT_INFO, data);
			const result2 = resolveLanXCommand(XHeader.TURNOUT_INFO, data);

			expect(result1).toBe(result2);
			expect(result1).toBe('LAN_X_GET_TURNOUT_INFO');
		});
	});

	describe('data payload preservation', () => {
		it('does not modify input data', () => {
			const data = makePayload(0x01, 0x02, 0x03);
			const originalBytes = [data[0], data[1], data[2]];

			resolveLanXCommand(XHeader.TURNOUT_INFO, data);

			expect(data[0]).toBe(originalBytes[0]);
			expect(data[1]).toBe(originalBytes[1]);
			expect(data[2]).toBe(originalBytes[2]);
		});
	});
});
