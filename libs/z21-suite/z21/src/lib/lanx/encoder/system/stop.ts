/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanX } from '../../../codec/frames';

/**
 * Encode a LAN_X_SET_STOP command into a Buffer.
 */
export function encodeLanXSetStop(): Buffer {
	return encodeLanX('LAN_X_SET_STOP');
}
