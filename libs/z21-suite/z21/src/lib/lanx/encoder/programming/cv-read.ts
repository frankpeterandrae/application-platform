import { encodeCvAddress, encodeLanX } from '../../../codec/frames';

/**
 * Encodes a LAN_X CV read command.
 * @param cvAddress - CV address to read (1-1024)
 * @returns Encoded LAN_X frame buffer
 * @throws Error if CV address is out of range
 */
export function encodeLanXCvRead(cvAddress: number): Buffer {
	if (cvAddress < 1 || cvAddress > 1024) {
		throw new Error(`CV adress out of range: ${cvAddress}`);
	}

	const { adrMsb, adrLsb } = encodeCvAddress(cvAddress);

	// CV_READ format: 23 11 <MSB> <LSB> <XOR>
	// Z21 uses MSB-first byte order for CV addresses (verified with Z21 Maintenance Tool)
	return encodeLanX('LAN_X_CV_READ', [adrMsb, adrLsb]);
}
