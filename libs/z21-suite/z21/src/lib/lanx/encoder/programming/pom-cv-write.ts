/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Encodes a Programming powerOn Main (POM) CV write command.
 * @param cvAddress - CV address to write
 * @param cvValue - CV value to write (0-255)
 * @returns Uint8Array representing the POM CV write command payload
 */
export function encodePomCvWrite(cvAddress: number, cvValue: number): Uint8Array {
	const payload = new Uint8Array(3);
	const cvAddressZeroBased = cvAddress - 1;
	payload[0] = cvAddressZeroBased & 0xff;
	payload[1] = (cvAddressZeroBased >> 8) & 0xff;
	payload[2] = cvValue & 0xff;
	return payload;
}
