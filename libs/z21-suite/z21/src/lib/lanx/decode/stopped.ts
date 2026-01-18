/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

/**
 * Decodes a LAN X payload indicating that the command station has stopped.
 *
 * @returns An array containing a single event of type 'event.z21.stopped'.
 */
export function decodeLanXStoppedPayload(): Extract<Z21Event, { type: 'event.z21.stopped' }>[] {
	return [
		{
			type: 'event.z21.stopped'
		}
	];
}
