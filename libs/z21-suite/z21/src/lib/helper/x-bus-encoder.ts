/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Encode an X-BUS LAN frame into a Buffer suitable for UDP transmission.
 *
 * Frame layout (bytes, little-endian):
 *  - Offset 0..1  : uint16 LE - total frame length in bytes (len)
 *  - Offset 2..3  : uint16 LE - header (X-BUS or LAN header)
 *  - Offset 4..    : payload bytes (optional)
 *
 * Notes:
 *  - `len` is computed as 2 (len field) + 2 (header field) + payloadLength,
 *    which results in a total of 4 + payloadLength bytes written into the Buffer.
 *  - All integer writes use little-endian (LE) encoding via Buffer.writeUInt16LE / writeUInt32LE.
 *  - If `payload` is omitted or has length 0, the returned Buffer contains only the 4-byte header block.
 *
 * @param header - Numeric header identifier (e.g. X-BUS command or LAN header)
 * @param payload - Optional binary payload to follow the header
 * @returns Buffer containing the encoded LAN/X frame ready for sending over UDP
 */
export function encodeXBusLanFrame(header: number, payload?: Buffer): Buffer {
	const payloadLength = payload?.length ?? 0;
	const len = 2 + 2 + payloadLength;

	const buffer = Buffer.alloc(len);
	buffer.writeUInt16LE(len, 0);
	buffer.writeUInt16LE(header, 2);
	if (payload) {
		payload.copy(buffer, 4);
	}
	return buffer;
}
