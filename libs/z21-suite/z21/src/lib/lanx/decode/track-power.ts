/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LanXCommandKey } from '@application-platform/z21-shared';

import type { Z21Event } from '../../event/event-types';

/**
 * Decodes track power on/off commands into Z21Event entries.
 *
 * @param command - The LAN X command key.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXTrackPowerPayload(command: LanXCommandKey): Extract<Z21Event, { type: 'event.track.power' }>[] {
	if (command === 'LAN_X_BC_TRACK_POWER_OFF') {
		return [{ type: 'event.track.power', on: false }];
	}

	if (command === 'LAN_X_BC_TRACK_POWER_ON') {
		return [{ type: 'event.track.power', on: true }];
	}

	return [];
}
