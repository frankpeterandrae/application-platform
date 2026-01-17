/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Options for Programming on the Main (POM) commands.
 * Used in CV_POM X-BUS header messages.
 */
export const enum POM_Options {
	/** Read byte from CV */
	READ_BYTE = 0xe4,
	/** Write bit to CV */
	WRITE_BIT = 0xe8,
	/** Write byte to CV */
	WRITE_BYTE = 0xec
}
