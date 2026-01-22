/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../event/event-types';
import { CentralStatus } from '../../event/event-types';

/**
 * Decodes LAN X system commands into Z21Event arrays.
 *
 * @param payload - The X-BUS dataset bytes.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXStatusChangedPayload(payload: Uint8Array): Extract<Z21Event, { event: 'system.event.status' }>[] {
	if (payload.length < 2) {
		return [];
	}

	const raw = Array.from(payload);
	const emergencyStop = (payload[1] & CentralStatus.EmergencyStop) !== 0;
	const shortCircuit = (payload[1] & CentralStatus.ShortCircuit) !== 0;
	const trackVoltageOff = (payload[1] & CentralStatus.TrackVoltageOff) !== 0;
	const on = !trackVoltageOff;
	const programmingMode = (payload[1] & CentralStatus.ProgrammingModeActive) !== 0;

	return [
		{
			event: 'system.event.status',
			payload: {
				emergencyStop,
				shortCircuit,
				powerOn: on,
				programmingMode,
				raw
			}
		}
	];
}
