/**
 * Encodes a Programming on Main (POM) CV read command.
 * @param cvAdress - CV address to read
 * @returns Array of bytes representing the POM CV read command
 */
export function encodePomCvRead(cvAdress: number): number[] {
	return [
		0xe4, // POM CV Read Command
		(cvAdress >> 8) & 0xff, // High byte of CV address
		cvAdress & 0xff // Low byte of CV address
	];
}
