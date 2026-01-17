/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Direction } from '@application-platform/z21-shared';

import { encodeLanX, encodeLocoAddress } from '../../../codec/frames';
import { SpeedByteMask } from '../../../constants';

/**
 * Encode a 128-step speed value into the internal code used by the X‑BUS drive command.
 *
 * Encoding rules:
 * - If estop === true, return 1 (special emergency-stop code).
 * - If step <= 0, return 0 (stopped).
 * - If step > 126, clamp to 126 (maximum usable step before masking).
 * - Otherwise return step + 1 (because X-BUS maps real steps shifted by +1).
 *
 * Returned value is in the range 0..127 (fits into the 7-bit speed field).
 *
 * @param step - Speed step in the expected 0..126 range (128 treated specially in external checks).
 * @param estop - If true, encode emergency-stop special value.
 * @returns Encoded speed code (0..127).
 */
function encodeSpeed128(step: number, estop = false): number {
	if (estop) return 1;
	if (step <= 0) return 0;
	if (step > 126) step = 126;
	return step + 1; // Step 1 -> 2, Step 126 -> 127
}

/**
 * Compose the direction+speed byte for 128-step X-BUS loco drive commands.
 *
 * This byte encodes a direction bit in the MSB and the 7-bit speed value in the low bits.
 *
 * @param forward - Direction string ('FWD' for forward, otherwise treated as reverse).
 * @param speedCode0to127 - Encoded speed code returned from encodeSpeed128 (0..127).
 * @returns Single byte with direction bit and speed bits ORed together.
 */
function encodeDirSpeedByte(forward: Direction, speedCode0to127: number): number {
	const directionBit = forward === 'FWD' ? SpeedByteMask.DIRECTION_FORWARD : SpeedByteMask.DIRECTION_REWARD;
	return directionBit | (speedCode0to127 & SpeedByteMask.VALUE);
}

/**
 * Encode a 128-step locomotive drive LAN_X frame.
 *
 * This function performs input validation on `step0to126`, converts the user-visible
 * step into the X-BUS code, composes the direction/speed byte and the loco address bytes,
 * and wraps everything into a LAN_X frame using `encodeLanX`.
 *
 * @param address - Locomotive address (DCC address). Valid range: 1..9999.
 * @param step0to126 - Speed expressed in discrete steps (0 = stop, up to 126). Values outside will throw.
 * @param forward - Direction ('FWD' or e.g. 'REV') used to set the direction bit.
 * @throws Error if `step0to126` is outside allowed range (less than 0 or greater than 128).
 * @returns Buffer with a complete LAN_X loco drive frame.
 */
export function encodeLocoDrive128(address: number, step0to126: number, forward: Direction): Buffer {
	if (step0to126 < 0 || step0to126 > 128) {
		throw new Error('Speed out of range (0..128)');
	}
	const speedCode = encodeSpeed128(step0to126);
	const rv = encodeDirSpeedByte(forward, speedCode);

	const { adrMsb, adrLsb } = encodeLocoAddress(address);
	return encodeLanX('LAN_X_SET_LOCO_DRIVE_128', [adrMsb, adrLsb, rv]);
}
