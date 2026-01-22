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
export function decodeLanXTrackPowerPayload(command: LanXCommandKey): Extract<Z21Event, { event: 'system.event.track.power' }>[] {
	const raw = Array.from(Buffer.from(command, 'ascii'));
	if (command === 'LAN_X_BC_TRACK_POWER_OFF') {
		return [
			{
				event: 'system.event.track.power',
				payload: { emergencyStop: false, powerOn: false, programmingMode: false, shortCircuit: false, raw }
			}
		];
	}

	if (command === 'LAN_X_BC_TRACK_POWER_ON') {
		return [
			{
				event: 'system.event.track.power',
				payload: { emergencyStop: false, powerOn: true, programmingMode: false, shortCircuit: false, raw }
			}
		];
	}

	if (command === 'LAN_X_BC_PROGRAMMING_MODE') {
		return [
			{
				event: 'system.event.track.power',
				payload: { emergencyStop: false, powerOn: true, programmingMode: true, shortCircuit: false, raw }
			}
		];
	}

	if (command === 'LAN_X_BC_TRACK_SHORT_CIRCUIT') {
		return [
			{
				event: 'system.event.track.power',
				payload: { emergencyStop: false, powerOn: false, programmingMode: false, shortCircuit: true, raw }
			}
		];
	}

	return [];
}
