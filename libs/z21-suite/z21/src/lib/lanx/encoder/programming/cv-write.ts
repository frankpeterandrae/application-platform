import { encodeCvAddress, encodeLanX } from '../../../codec/frames';
import { FULL_BYTE_MASK } from '../../../constants';

/**
 * Encodes a LAN_X CV write command.
 * @param cvAddress - CV address to write (1-1024)
 * @param cvValue - CV value to write (0-255)
 * @returns Encoded LAN_X frame buffer
 * @throws Error if CV address or value is out of range
 */
export function encodeLanXCvWrite(cvAddress: number, cvValue: number): Buffer {
	if (cvAddress < 1 || cvAddress > 1024) {
		throw new Error(`CV adress out of range: ${cvAddress}`);
	}

	if (cvValue < 0 || cvValue > 255) {
		throw new Error(`CV value out of range: ${cvValue}`);
	}

	const { adrMsb, adrLsb } = encodeCvAddress(cvAddress);

	// CV_WRITE format: 24 12 <MSB> <LSB> <VALUE> <XOR>
	// Z21 uses MSB-first byte order for CV addresses (verified with Z21 Maintenance Tool)
	const value = cvValue & FULL_BYTE_MASK;
	return encodeLanX('LAN_X_CV_WRITE', [adrMsb, adrLsb, value]);
}
