/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Direction } from '@application-platform/z21-shared';

import {
	AddessByteMask,
	F13ToF20FunctionsByteMask,
	F21ToF28FunctionsByteMask,
	F29ToF31FunctionsByteMask,
	F5ToF12FunctionsByteMask,
	InfoByteMask,
	LowFunctionsByteMask,
	SpeedByteMask
} from '../../constants';
import { type Z21Event } from '../../event/event-types';

import { decodeLanXLocoInfoPayload } from './loco-info';

type LocoInfoEvent = Extract<Z21Event, { type: 'event.loco.info' }>;

describe('decodeLanXLocoInfoPayload', () => {
	it('decodes full payload with all flags and functions', () => {
		const adrMsb = 0x12;
		const adrLsb = 0x34;
		const db2 = InfoByteMask.MM_LOCO | InfoByteMask.OCCUPIED | 0b10; // speedStepCode=2 => 28 steps
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0b00101; // raw=5 => speed=4
		const db4 =
			LowFunctionsByteMask.L |
			LowFunctionsByteMask.F1 |
			LowFunctionsByteMask.F2 |
			LowFunctionsByteMask.F3 |
			LowFunctionsByteMask.F4 |
			LowFunctionsByteMask.D |
			LowFunctionsByteMask.S;
		const db5 =
			F5ToF12FunctionsByteMask.F5 |
			F5ToF12FunctionsByteMask.F6 |
			F5ToF12FunctionsByteMask.F7 |
			F5ToF12FunctionsByteMask.F8 |
			F5ToF12FunctionsByteMask.F9 |
			F5ToF12FunctionsByteMask.F10 |
			F5ToF12FunctionsByteMask.F11 |
			F5ToF12FunctionsByteMask.F12;
		const db6 =
			F13ToF20FunctionsByteMask.F13 |
			F13ToF20FunctionsByteMask.F14 |
			F13ToF20FunctionsByteMask.F15 |
			F13ToF20FunctionsByteMask.F16 |
			F13ToF20FunctionsByteMask.F17 |
			F13ToF20FunctionsByteMask.F18 |
			F13ToF20FunctionsByteMask.F19 |
			F13ToF20FunctionsByteMask.F20;
		const db7 =
			F21ToF28FunctionsByteMask.F21 |
			F21ToF28FunctionsByteMask.F22 |
			F21ToF28FunctionsByteMask.F23 |
			F21ToF28FunctionsByteMask.F24 |
			F21ToF28FunctionsByteMask.F25 |
			F21ToF28FunctionsByteMask.F26 |
			F21ToF28FunctionsByteMask.F27 |
			F21ToF28FunctionsByteMask.F28;
		const db8 = F29ToF31FunctionsByteMask.F29 | F29ToF31FunctionsByteMask.F30 | F29ToF31FunctionsByteMask.F31;

		const data = new Uint8Array([adrMsb, adrLsb, db2, db3, db4, db5, db6, db7, db8]);

		const [event] = decodeLanXLocoInfoPayload(data) as LocoInfoEvent[];

		expect(event.addr).toBe(((adrMsb & AddessByteMask.MSB) << 8) + adrLsb);
		expect(event.type).toBe('event.loco.info');
		expect(event.isMmLoco).toBe(true);
		expect(event.isOccupied).toBe(true);
		expect(event.isDoubleTraction).toBe(true);
		expect(event.isSmartsearch).toBe(true);
		expect(event.speedSteps).toBe(28);
		expect(event.speed).toBe(4);
		expect(event.emergencyStop).toBe(false);
		expect(event.direction).toBe(Direction.FWD);
		expect(event.functionMap[0]).toBe(true);
		expect(event.functionMap[4]).toBe(true);
		expect(event.functionMap[5]).toBe(true);
		expect(event.functionMap[12]).toBe(true);
		expect(event.functionMap[13]).toBe(true);
		expect(event.functionMap[20]).toBe(true);
		expect(event.functionMap[21]).toBe(true);
		expect(event.functionMap[28]).toBe(true);
		expect(event.functionMap[29]).toBe(true);
		expect(event.functionMap[31]).toBe(true);
	});

	it('maps speed steps and emergency stop when raw speed is 1', () => {
		const data = new Uint8Array([0, 1, 0b10, 0b00000001, 0, 0]);

		const [event] = decodeLanXLocoInfoPayload(data) as LocoInfoEvent[];

		expect(event.speedSteps).toBe(28);
		expect(event.emergencyStop).toBe(true);
		expect(event.speed).toBe(0);
		expect(event.direction).toBe(Direction.REV);
	});

	it('maps speed steps to 14 when step code is 0 and speed raw is 0', () => {
		const data = new Uint8Array([0, 1, 0b00, 0b00000000, 0]);

		const [event] = decodeLanXLocoInfoPayload(data) as LocoInfoEvent[];

		expect(event.speedSteps).toBe(14);
		expect(event.speed).toBe(0);
		expect(event.emergencyStop).toBe(false);
	});

	it('maps speed steps to 128 when step code is not 0 or 2', () => {
		const data = new Uint8Array([0, 1, 0b01, 0b00000110, 0]);

		const [event] = decodeLanXLocoInfoPayload(data) as LocoInfoEvent[];

		expect(event.speedSteps).toBe(128);
		expect(event.speed).toBe(5);
	});

	it('handles minimal payload setting only F0-F4 functions', () => {
		const db4 = LowFunctionsByteMask.L | LowFunctionsByteMask.F1;
		const data = new Uint8Array([0, 1, 0, 0, db4]);

		const [event] = decodeLanXLocoInfoPayload(data) as LocoInfoEvent[];

		expect(event.functionMap[0]).toBe(true);
		expect(event.functionMap[1]).toBe(true);
		expect(event.functionMap[2]).toBe(false);
		expect(event.functionMap[5]).toBeUndefined();
		expect(event.functionMap[13]).toBeUndefined();
		expect(event.functionMap[21]).toBeUndefined();
		expect(event.functionMap[29]).toBeUndefined();
	});
});
