/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';

import { encodeLanXSetTrackPowerOff, encodeLanXSetTrackPowerOn } from './track-power';

describe('encodeLanXSetTrackPowerOff', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetTrackPowerOff();
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetTrackPowerOff();
		const len = result.readUInt16LE(0);

		expect(len).toBe(7);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetTrackPowerOff();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes STATUS xbus header', () => {
		const result = encodeLanXSetTrackPowerOff();

		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
		expect(result[4]).toBe(trackPowerOff.xBusHeader);
	});

	it('includes Off track power value', () => {
		const result = encodeLanXSetTrackPowerOff();

		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
		expect(result[5]).toBe(trackPowerOff.xBusCmd);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTrackPowerOff();
		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
		const payload = [trackPowerOff.xBusHeader, trackPowerOff.xBusCmd];
		const expectedXor = xbusXor(payload);

		expect(result[6]).toBe(expectedXor);
	});

	it('returns different result than power on command', () => {
		const off = encodeLanXSetTrackPowerOff();
		const on = encodeLanXSetTrackPowerOn();

		expect(off).not.toEqual(on);
	});

	it('produces consistent output on multiple calls', () => {
		const result1 = encodeLanXSetTrackPowerOff();
		const result2 = encodeLanXSetTrackPowerOff();

		expect(result1).toEqual(result2);
	});
});

describe('encodeLanXSetTrackPowerOn', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetTrackPowerOn();
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetTrackPowerOn();
		const len = result.readUInt16LE(0);

		expect(len).toBe(7);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetTrackPowerOn();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes STATUS xbus header', () => {
		const result = encodeLanXSetTrackPowerOn();

		const trackPowerOn = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
		expect(result[4]).toBe(trackPowerOn.xBusHeader);
	});

	it('includes On track power value', () => {
		const result = encodeLanXSetTrackPowerOn();

		const trackPowerOn = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
		expect(result[5]).toBe(trackPowerOn.xBusCmd);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTrackPowerOn();
		const trackPowerOn = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
		const payload = [trackPowerOn.xBusHeader, trackPowerOn.xBusCmd];
		const expectedXor = xbusXor(payload);

		expect(result[6]).toBe(expectedXor);
	});

	it('returns different result than power off command', () => {
		const on = encodeLanXSetTrackPowerOn();
		const off = encodeLanXSetTrackPowerOff();

		expect(on).not.toEqual(off);
	});

	it('produces consistent output on multiple calls', () => {
		const result1 = encodeLanXSetTrackPowerOn();
		const result2 = encodeLanXSetTrackPowerOn();

		expect(result1).toEqual(result2);
	});
});
