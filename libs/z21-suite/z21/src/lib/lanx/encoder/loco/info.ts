/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanX, encodeLocoAddress } from '../../../codec/frames';

/**
 * Encode a LAN_X LOCO_INFO command for a given address.
 *
 * Note: The function name currently contains a typo (`encdode...`) — the function is exported
 * under that name to avoid breaking existing callers. The behaviour is correct: it composes the
 * LOCO_INFO X-BUS header and the loco address bytes and then wraps them in a LAN_X frame.
 *
 * @param address - Locomotive numeric address to query (1..9999)
 * @returns Buffer containing the LOCO_INFO LAN_X command.
 */
export function encodeLanXGetLocoInfo(address: number): Buffer {
	const { adrMsb, adrLsb } = encodeLocoAddress(address);

	return encodeLanX('LAN_X_GET_LOCO_INFO', [adrMsb, adrLsb]);
}
