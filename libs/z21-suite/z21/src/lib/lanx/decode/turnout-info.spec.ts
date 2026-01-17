/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TurnoutState } from '@application-platform/z21-shared';

import { AddessByteMask } from '../../constants';
import { type Z21Event } from '../../event/event-types';

import { decodeLanXTurnoutInfoPayload } from './turnout-info';

type TurnoutInfoEvent = Extract<Z21Event, { type: 'event.turnout.info' }>;

describe('decodeLanXTurnoutInfoPayload', () => {
	it('returns STRAIGHT when zz is 1', () => {
		const data = new Uint8Array([0x12, 0x34, 0x01]);
		const [event] = decodeLanXTurnoutInfoPayload(data) as TurnoutInfoEvent[];

		expect(event.state).toBe(TurnoutState.STRAIGHT);
		expect(event.addr).toBe(((0x12 & AddessByteMask.MSB) << 8) + 0x34);
		expect(event.type).toBe('event.turnout.info');
	});

	it('returns DIVERGING when zz is 2', () => {
		const data = new Uint8Array([0xab, 0xcd, 0x02]);
		const [event] = decodeLanXTurnoutInfoPayload(data) as TurnoutInfoEvent[];

		expect(event.state).toBe(TurnoutState.DIVERGING);
		expect(event.addr).toBe(((0xab & AddessByteMask.MSB) << 8) + 0xcd);
	});

	it('returns UNKNOWN when zz is neither 1 nor 2', () => {
		const data = new Uint8Array([0xff, 0xee, 0x03]);
		const [event] = decodeLanXTurnoutInfoPayload(data) as TurnoutInfoEvent[];

		expect(event.state).toBe(TurnoutState.UNKNOWN);
	});
});
