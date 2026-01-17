/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { XBusCmd } from '@application-platform/z21-shared';

import { type Z21Event } from '../../event/event-types';

import { decodeLanXStatusChangedPayload } from './status-changed';

type CsStatusEvent = Extract<Z21Event, { type: 'event.system.state' }>;

describe('decodeLanXSystem', () => {
	it('returns event.system.state with statusMask from third byte when command is LAN_X_STATUS_CHANGED', () => {
		const data = new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]);

		const events = decodeLanXStatusChangedPayload(data) as CsStatusEvent[];

		expect(events).toEqual([{ type: 'event.system.state', statusMask: 0xaa }]);
	});

	it('returns empty array when command is LAN_X_STATUS_CHANGED but data is too short', () => {
		const data = new Uint8Array([XBusCmd.STATUS_CHANGED]);

		const events = decodeLanXStatusChangedPayload(data) as CsStatusEvent[];

		expect(events).toEqual([]);
	});
});
