import { encodeLanX } from '../../../codec/frames';

/**
 * Encodes a LAN_X_GET_STATUS command into a Buffer.
 * @returns Buffer containing the encoded command.
 */
export function encodeLanXSystemStatus(): Buffer {
	return encodeLanX('LAN_X_GET_STATUS');
}
