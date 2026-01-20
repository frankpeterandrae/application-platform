/**
 * Encodes a Programming on Main (POM) CV write command.
 * @param cvAdress - CV address to write
 * @param cvValue - CV value to write (0-255)
 * @returns Uint8Array representing the POM CV write command payload
 */
export function encodePomCvWrite(cvAdress: number, cvValue: number): Uint8Array {
	const payload = new Uint8Array(3);
	const cvAdressZeroBased = cvAdress - 1;
	payload[0] = cvAdressZeroBased & 0xff;
	payload[1] = (cvAdressZeroBased >> 8) & 0xff;
	payload[2] = cvValue & 0xff;
	return payload;
}
