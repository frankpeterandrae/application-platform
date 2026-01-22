/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

/**
 * Decodes a LAN X payload indicating that the command station has stopped.
 *
 * @returns An array containing a single event of type 'system.event.stopped'.
 */
export function decodeLanXStoppedPayload(): Extract<Z21Event, { event: 'system.event.stopped' }>[] {
	return [
		{
			event: 'system.event.stopped',
			payload: {
				raw: [] // No additional data in the payload
			}
		}
	];
}
