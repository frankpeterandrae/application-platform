/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';
import { AddessByteMask, FULL_BYTE_MASK } from '../../../constants';

import { encodeLanXSetLocoEStop } from './estop';

describe('encodeLanXSetLocoEStop', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetLocoEStop(100);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetLocoEStop(100);
		const len = result.readUInt16LE(0);

		expect(len).toBe(8);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetLocoEStop(100);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes E_STOP xbus header', () => {
		const result = encodeLanXSetLocoEStop(100);

		const eStopCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_E_STOP;
		expect(result[4]).toBe(eStopCommand.xHeader);
	});

	it('encodes minimum address correctly', () => {
		const result = encodeLanXSetLocoEStop(1);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x01);
	});

	it('encodes maximum address correctly', () => {
		const result = encodeLanXSetLocoEStop(9999);

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('encodes short address correctly', () => {
		const result = encodeLanXSetLocoEStop(50);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x32);
	});

	it('encodes long address with prefix correctly', () => {
		const result = encodeLanXSetLocoEStop(500);

		const addrHigh = 0xc0 | ((500 >> 8) & AddessByteMask.MSB);
		const addrLow = 500 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetLocoEStop(100);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same address', () => {
		const result1 = encodeLanXSetLocoEStop(100);
		const result2 = encodeLanXSetLocoEStop(100);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXSetLocoEStop(100);
		const result2 = encodeLanXSetLocoEStop(200);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 1', () => {
		expect(() => encodeLanXSetLocoEStop(0)).toThrow('Address');
	});

	it('throws error for address above 9999', () => {
		expect(() => encodeLanXSetLocoEStop(10000)).toThrow('Address');
	});

	it('throws error for negative address', () => {
		expect(() => encodeLanXSetLocoEStop(-1)).toThrow('Address');
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLanXSetLocoEStop(127);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLanXSetLocoEStop(128);

		const addrHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const addrLow = 128 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});
});
