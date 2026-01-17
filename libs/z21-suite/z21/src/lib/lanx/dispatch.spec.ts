/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { XBusCmd, XHeader, Z21LanHeader } from '@application-platform/z21-shared';

import { resolveLanXCommand } from './dispatch';

describe('resolveLanXCommand', () => {
	it('should return LAN_X_GET_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is 1', () => {
		const xHeader = XHeader.TURNOUT_INFO;
		const data = new Uint8Array([0x01]);
		expect(resolveLanXCommand(xHeader, data)).toBe('LAN_X_GET_TURNOUT_INFO');
	});

	it('should return LAN_X_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is 2', () => {
		const xHeader = XHeader.TURNOUT_INFO;
		const data = new Uint8Array([0x01, 0x02]);
		expect(resolveLanXCommand(xHeader, data)).toBe('LAN_X_TURNOUT_INFO');
	});

	it('should return LAN_X_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is greater than 2', () => {
		const xHeader = XHeader.TURNOUT_INFO;
		const data = new Uint8Array([Z21LanHeader.LAN_X, XHeader.TURNOUT_INFO, 0x01, 0x02, 0x03, 0x04]);
		expect(resolveLanXCommand(xHeader, data)).toBe('LAN_X_TURNOUT_INFO');
	});

	it('should return LAN_X_UNKNOWN_COMMAND when xHeader is TURNOUT_INFO and length is less than 1', () => {
		const xHeader = XHeader.TURNOUT_INFO;
		const data = new Uint8Array([]);
		expect(resolveLanXCommand(xHeader, data)).toBe('LAN_X_UNKNOWN_COMMAND');
	});

	it('should return LAN_X_UNKNOWN_COMMAND when data is empty', () => {
		const xHeader = XHeader.BROADCAST;
		const data = new Uint8Array([]);
		expect(resolveLanXCommand(xHeader, data)).toBe('LAN_X_UNKNOWN_COMMAND');
	});

	it('should return correct command for known xHeader and xBusCmd', () => {
		const xHeader = XHeader.BROADCAST;
		const data = new Uint8Array([XBusCmd.BC_TRACK_POWER_ON, 0x01]); // Assuming 0x01 corresponds to a known command
		expect(resolveLanXCommand(xHeader, data)).toBe('LAN_X_BC_TRACK_POWER_ON');
	});
});
