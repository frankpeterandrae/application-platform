/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanX, encodeLocoAddress } from '../../../codec/frames';
import type { LocoFunctionSwitchType } from '../../../constants';

/**
 * Encode a Set Loco Function (F0..Fn) X-BUS command wrapped in LAN_X.
 *
 * The function encodes the argument `type` (two bits) into the top bits and the function number
 * (0..31) into the lower bits of the command's data byte. The resulting X-BUS payload is then
 * passed to `encodeLanX`.
 *
 * @param address - Locomotive address to target (1..9999).
 * @param functionNumber - Function index to modify (0..31). Throws if out of range.
 * @param type - One of the LocoFunctionSwitchType flags (Off, On, Toggle).
 * @throws Error if `functionNumber` is not in the 0..31 range.
 * @returns Buffer containing the LAN_X LOCO_FUNCTION message.
 */
export function encodeLanXSetLocoFunction(address: number, functionNumber: number, type: LocoFunctionSwitchType): Buffer {
	if (functionNumber < 0 || functionNumber > 31) {
		throw new Error('Function number out of range (0..31)');
	}

	const { adrMsb, adrLsb } = encodeLocoAddress(address);

	const ttNn = ((type & 0b11) << 6) | (functionNumber & 0x3f);

	return encodeLanX('LAN_X_SET_LOCO_FUNCTION', [adrMsb, adrLsb, ttNn]);
}
