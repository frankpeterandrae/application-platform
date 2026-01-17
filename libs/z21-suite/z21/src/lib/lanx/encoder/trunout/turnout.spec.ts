/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';
import { AddessByteMask, FULL_BYTE_MASK } from '../../../constants';

import { encodeLanXGetTurnoutInfo, encodeLanXSetTurnout } from './turnout';

describe('encodeLanXGetTurnoutInfo', () => {
	it('returns a buffer', () => {
		const result = encodeLanXGetTurnoutInfo(100);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXGetTurnoutInfo(100);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes TURNOUT_INFO xbus header', () => {
		const result = encodeLanXGetTurnoutInfo(100);

		const turnoutInfoCommand = LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO;
		expect(result[4]).toBe(turnoutInfoCommand.xHeader);
	});

	it('encodes minimum accessory address', () => {
		const result = encodeLanXGetTurnoutInfo(0);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x00);
	});

	it('encodes maximum accessory address', () => {
		const result = encodeLanXGetTurnoutInfo(16383);

		const addrHigh = (16383 >> 8) & AddessByteMask.MSB;
		const addrLow = 16383 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('encodes mid-range accessory address', () => {
		const result = encodeLanXGetTurnoutInfo(500);

		const addrHigh = (500 >> 8) & AddessByteMask.MSB;
		const addrLow = 500 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXGetTurnoutInfo(100);

		const payload = Array.from(result.subarray(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same address', () => {
		const result1 = encodeLanXGetTurnoutInfo(100);
		const result2 = encodeLanXGetTurnoutInfo(100);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXGetTurnoutInfo(100);
		const result2 = encodeLanXGetTurnoutInfo(200);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 0', () => {
		expect(() => encodeLanXGetTurnoutInfo(-1)).toThrow('Accessory address');
	});

	it('throws error for address above 16383', () => {
		expect(() => encodeLanXGetTurnoutInfo(16384)).toThrow('Accessory address');
	});

	it('handles boundary case with address 255', () => {
		const result = encodeLanXGetTurnoutInfo(255);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0xff);
	});

	it('handles boundary case with address 256', () => {
		const result = encodeLanXGetTurnoutInfo(256);

		expect(result[5]).toBe(0x01);
		expect(result[6]).toBe(0x00);
	});

	it('masks high byte to 6 bits', () => {
		const result = encodeLanXGetTurnoutInfo(16383);

		expect(result[5]).toBe(AddessByteMask.MSB);
	});
});

describe('encodeLanXSetTurnout', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes SET_TURNOUT xbus header', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		const setTurnoutCommand = LAN_X_COMMANDS.LAN_X_SET_TURNOUT;
		expect(result[4]).toBe(setTurnoutCommand.xHeader);
	});

	it('encodes port 0 activated', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		expect(result[7] & 0x01).toBe(0x00);
		expect(result[7] & 0x08).toBe(0x08);
	});

	it('encodes port 1 activated', () => {
		const result = encodeLanXSetTurnout(100, 1, true, false);

		expect(result[7] & 0x01).toBe(0x01);
		expect(result[7] & 0x08).toBe(0x08);
	});

	it('encodes port 0 deactivated', () => {
		const result = encodeLanXSetTurnout(100, 0, false, false);

		expect(result[7] & 0x01).toBe(0x00);
		expect(result[7] & 0x08).toBe(0x00);
	});

	it('encodes port 1 deactivated', () => {
		const result = encodeLanXSetTurnout(100, 1, false, false);

		expect(result[7] & 0x01).toBe(0x01);
		expect(result[7] & 0x08).toBe(0x00);
	});

	it('encodes queue enabled', () => {
		const result = encodeLanXSetTurnout(100, 0, true, true);

		expect(result[7] & 0x20).toBe(0x20);
	});

	it('encodes queue disabled', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		expect(result[7] & 0x20).toBe(0x00);
	});

	it('sets base bit pattern with 0x80', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		expect(result[7] & 0x80).toBe(0x80);
	});

	it('encodes minimum accessory address', () => {
		const result = encodeLanXSetTurnout(0, 0, true, false);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x00);
	});

	it('encodes maximum accessory address', () => {
		const result = encodeLanXSetTurnout(16383, 0, true, false);

		const addrHigh = (16383 >> 8) & AddessByteMask.MSB;
		const addrLow = 16383 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		const payload = Array.from(result.subarray(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same parameters', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 0, true, false);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different ports', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 1, true, false);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different activation states', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 0, false, false);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different queue states', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 0, true, true);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(200, 0, true, false);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 0', () => {
		expect(() => encodeLanXSetTurnout(-1, 0, true, false)).toThrow('Accessory address');
	});

	it('throws error for address above 16383', () => {
		expect(() => encodeLanXSetTurnout(16384, 0, true, false)).toThrow('Accessory address');
	});

	it('encodes all flags combined correctly', () => {
		const result = encodeLanXSetTurnout(100, 1, true, true);

		const db2 = result[7];
		expect(db2 & 0x80).toBe(0x80);
		expect(db2 & 0x20).toBe(0x20);
		expect(db2 & 0x08).toBe(0x08);
		expect(db2 & 0x01).toBe(0x01);
	});

	it('masks control byte to single byte', () => {
		const result = encodeLanXSetTurnout(100, 1, true, true);

		expect(result[7]).toBeLessThanOrEqual(0xff);
	});

	it('handles boundary case with address 255', () => {
		const result = encodeLanXSetTurnout(255, 0, true, false);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0xff);
	});

	it('handles boundary case with address 256', () => {
		const result = encodeLanXSetTurnout(256, 0, true, false);

		expect(result[5]).toBe(0x01);
		expect(result[6]).toBe(0x00);
	});
});
