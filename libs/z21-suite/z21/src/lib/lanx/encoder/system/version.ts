import { encodeLanX } from '../../../codec/frames';

/**
 * Encodes a LAN_X_GET_VERSION command into a Buffer.
 * @returns Buffer containing the encoded command.
 */
export function encodeLanXGetVersion(): Buffer {
	return encodeLanX('LAN_X_GET_VERSION');
}
