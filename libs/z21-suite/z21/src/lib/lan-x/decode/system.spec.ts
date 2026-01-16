/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../z21/event-types';

import { decodeLanXSystem } from './system';

type CsStatusEvent = Extract<Z21Event, { type: 'event.system.state' }>;

describe('decodeLanXSystem', () => {
	it('returns system.status with statusMask from third byte when command is LAN_X_STATUS_CHANGED', () => {
		const data = new Uint8Array([0x00, 0x00, 0xaa]);

		const events = decodeLanXSystem('LAN_X_STATUS_CHANGED', data) as CsStatusEvent[];

		expect(events).toEqual([{ type: 'event.system.state', statusMask: 0xaa }]);
	});

	it('returns empty array when command is LAN_X_STATUS_CHANGED but data is too short', () => {
		const data = new Uint8Array([0x01]);

		const events = decodeLanXSystem('LAN_X_STATUS_CHANGED', data) as CsStatusEvent[];

		expect(events).toEqual([]);
	});

	it('returns empty array for non-status commands', () => {
		const data = new Uint8Array([0x00, 0x00, 0xbb]);

		const events = decodeLanXSystem('LAN_X_UNKNOWN_COMMAND', data as any) as CsStatusEvent[];

		expect(events).toEqual([]);
	});
});
