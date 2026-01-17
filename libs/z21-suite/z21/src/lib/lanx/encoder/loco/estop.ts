/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanX, encodeLocoAddress } from '../../../codec/frames';

/**
 * Encode a LAN_X SET_LOCO_E_STOP command for a given locomotive address.
 *
 * @param address - Locomotive numeric address to emergency stop (1..9999)
 * @returns Buffer containing the SET_LOCO_E_STOP LAN_X command.
 */
export function encodeLanXSetLocoEStop(address: number): Buffer {
	const { adrMsb, adrLsb } = encodeLocoAddress(address);
	return encodeLanX('LAN_X_SET_LOCO_E_STOP', [adrMsb, adrLsb]);
}
