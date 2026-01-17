/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanX } from '../../../codec/frames';
import { AddessByteMask, FULL_BYTE_MASK } from '../../../constants';

/**
 * Encode an accessory (turnout) address into the two address bytes used by X-BUS.
 *
 * @param address - Accessory address (0..16383)
 * @throws Error if address is not in the allowed 0..16383 range.
 * @returns Object with `adrMsb` and `adrLsb` bytes (both 0..255).
 */
function encodeAccessoryAddress(address: number): { adrMsb: number; adrLsb: number } {
	if (address < 0 || address > 16383) {
		throw new Error(`Accessory address (${address}) out of range (0..16383)`);
	}

	const adrMsb = (address >> 8) & AddessByteMask.MSB;
	const adrLsb = address & FULL_BYTE_MASK;

	return { adrMsb, adrLsb };
}

/**
 * Encode a LAN_X TURNOUT_INFO command for a given turnout address.
 * This function encodes the turnout address into the appropriate X-BUS payload format,
 * then wraps it in a LAN_X frame.
 *
 * @param address - Turnout address (0..16383)
 * @returns Buffer containing the TURNOUT_INFO LAN_X command.
 */
export function encodeLanXGetTurnoutInfo(address: number): Buffer {
	const { adrMsb, adrLsb } = encodeAccessoryAddress(address);
	return encodeLanX('LAN_X_GET_TURNOUT_INFO', [adrMsb, adrLsb]);
}

/**
 * Encode a LAN_X SET_TURNOUT command.
 *
 * This function encodes the turnout address, port, activation state, and queuing flag
 * into the appropriate X-BUS payload format, then wraps it in a LAN_X frame.
 *
 * @param address - Turnout address (0..16383)
 * @param port - Port number (0 or 1)
 * @param activate - True to activate the turnout, false to deactivate
 * @param queue - True to queue the command, false for immediate execution
 * @returns Buffer containing the SET_TURNOUT LAN_X command.
 */
export function encodeLanXSetTurnout(address: number, port: 0 | 1, activate: boolean, queue: boolean): Buffer {
	const { adrMsb, adrLsb } = encodeAccessoryAddress(address);
	const queueByte = queue ? 0x20 : 0x00;
	const activateByte = activate ? 0x08 : 0x00;
	const portByte = port === 1 ? 0x01 : 0x00;
	const db2 = (0x80 | queueByte | activateByte | portByte) & FULL_BYTE_MASK;
	return encodeLanX('LAN_X_SET_TURNOUT', [adrMsb, adrLsb, db2]);
}
