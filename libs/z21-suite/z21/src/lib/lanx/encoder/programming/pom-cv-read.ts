/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Encodes a Programming on Main (POM) CV read command.
 * @param cvAddress - CV address to read
 * @returns Array of bytes representing the POM CV read command
 */
export function encodePomCvRead(cvAddress: number): number[] {
	return [
		0xe4, // POM CV Read Command
		(cvAddress >> 8) & 0xff, // High byte of CV address
		cvAddress & 0xff // Low byte of CV address
	];
}
