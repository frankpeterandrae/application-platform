/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';
import { AddessByteMask, FULL_BYTE_MASK } from '../../../constants';

import { encodeLanXSetLocoFunction } from './function';

describe('encodeLanXSetLocoFunction', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b00);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes function 0 with OFF type', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b00);

		const fullCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;
		expect(result[4]).toBe(fullCommand.xHeader);
		expect(result[5]).toBe(fullCommand.xBusCmd);
		expect(result[8]).toBe(0b00000000);
	});

	it('encodes function 0 with ON type', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b01);

		expect(result[8]).toBe(0b01000000);
	});

	it('encodes function 0 with TOGGLE type', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b10);

		expect(result[8]).toBe(0b10000000);
	});

	it('encodes function 31 with ON type', () => {
		const result = encodeLanXSetLocoFunction(100, 31, 0b01);

		expect(result[8]).toBe(0b01011111);
	});

	it('encodes function 15 with TOGGLE type', () => {
		const result = encodeLanXSetLocoFunction(100, 15, 0b10);

		expect(result[8]).toBe(0b10001111);
	});

	it('encodes minimum address correctly', () => {
		const result = encodeLanXSetLocoFunction(1, 5, 0b01);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x01);
	});

	it('encodes maximum address correctly', () => {
		const result = encodeLanXSetLocoFunction(9999, 5, 0b01);

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('encodes short address correctly', () => {
		const result = encodeLanXSetLocoFunction(50, 10, 0b01);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x32);
	});

	it('encodes long address with prefix correctly', () => {
		const result = encodeLanXSetLocoFunction(500, 10, 0b01);

		const addrHigh = 0xc0 | ((500 >> 8) & AddessByteMask.MSB);
		const addrLow = 500 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetLocoFunction(100, 10, 0b01);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same parameters', () => {
		const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
		const result2 = encodeLanXSetLocoFunction(100, 10, 0b01);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different function numbers', () => {
		const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
		const result2 = encodeLanXSetLocoFunction(100, 11, 0b01);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different function types', () => {
		const result1 = encodeLanXSetLocoFunction(100, 10, 0b00);
		const result2 = encodeLanXSetLocoFunction(100, 10, 0b01);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for function number below zero', () => {
		expect(() => encodeLanXSetLocoFunction(100, -1, 0b01)).toThrow('Function number out of range');
	});

	it('throws error for function number above 31', () => {
		expect(() => encodeLanXSetLocoFunction(100, 32, 0b01)).toThrow('Function number out of range');
	});

	it('throws error for invalid address below 1', () => {
		expect(() => encodeLanXSetLocoFunction(0, 10, 0b01)).toThrow('Address');
	});

	it('throws error for invalid address above 9999', () => {
		expect(() => encodeLanXSetLocoFunction(10000, 10, 0b01)).toThrow('Address');
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLanXSetLocoFunction(127, 10, 0b01);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLanXSetLocoFunction(128, 10, 0b01);

		const addrHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const addrLow = 128 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('masks type to 2 bits', () => {
		const result = encodeLanXSetLocoFunction(100, 10, 0b11111111 as any);

		expect(result[8]).toBe(0b11001010);
	});
});
