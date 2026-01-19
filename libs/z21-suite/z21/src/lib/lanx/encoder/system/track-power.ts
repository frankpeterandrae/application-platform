/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanX } from '../../../codec/frames';

/**
 * Encodes a command to turn track power OFF.
 * Generates a LAN_X message with STATUS header and Off value.
 * @returns Buffer containing the track power OFF command (7 bytes: 07 00 40 00 21 80 A1)
 */
export function encodeLanXSetTrackPowerOff(): Buffer {
	return encodeLanX('LAN_X_SET_TRACK_POWER_OFF', []);
}

/**
 * Encodes a command to turn track power ON.
 * Generates a LAN_X message with STATUS header and On value.
 * @returns Buffer containing the track power ON command (7 bytes: 07 00 40 00 21 81 A0)
 */
export function encodeLanXSetTrackPowerOn(): Buffer {
	return encodeLanX('LAN_X_SET_TRACK_POWER_ON', []);
}
