/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * X-BUS locomotive command types.
 * Used in LOCO_DRIVE X-BUS header messages.
 * Note: Same byte values may appear multiple times as they represent different
 * commands in different protocol contexts (e.g., 0x12 is CV_NACK_SC, WRITE, and LOCO_DRIVE_28).
 */
/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export const enum XBusCmd {
	BC_TRACK_POWER_OFF = 0x00,
	BC_TRACK_POWER_ON = 0x01,
	BC_BC_PROGRAMMING_MODE = 0x02,
	BC_TRACK_SHORT_CIRCUIT = 0x08,
	CV_NACK_SC = 0x12,
	CV_NACK = 0x13,
	READ = 0x11,
	WRITE = 0x12,
	CV_RESULT = 0x14,
	/** Request the version of the locomotive decoder. */
	GET_VERSION = 0x21,
	/** Notification that the status of the locomotive has changed. */
	STATUS_CHANGED = 0x22,
	/** Request the status of the locomotive. */
	GET_STATUS = 0x24,
	/** Purge the locomotive from its slot. */
	PURGE_LOCO = 0x44,
	/** Turn track power off. */
	TRACK_POWER_OFF = 0x80,
	/** Turn track power on. */
	TRACK_POWER_ON = 0x81,
	/** Purge the locomotive from its slot. */
	UNKNOWN_COMMAND = 0x82,
	/** Request locomotive information. */
	LOCO_INFO = 0xf0,
	/** Write a byte to a Märklin-Motorola decoder. */
	MM_WRITE_BYTE = 0xff,
	/** Set or toggle a locomotive function (F0..Fn). */
	LOCO_FUNCTION = 0xf8,
	/** Set function group F0 to F4. */
	FUNCTION_GRP_F0_F4 = 0x20,
	/** Set function group F5 to F8. */
	FUNCTION_GRP_F5_F8 = 0x21,
	/** Set function group F9 to F12. */
	FUNCTION_GRP_F9_F12 = 0x22,
	/** Set function group F13 to F20. */
	FUNCTION_GRP_F13_F20 = 0x23,
	/** Set function group F21 to F28. */
	FUNCTION_GRP_F21_F28 = 0x28,
	/** Set function group F29 to F36. */
	FUNCTION_GRP_F29_F36 = 0x29,
	/** Set function group F37 to F44. */
	FUNCTION_GRP_F37_F44 = 0x2a,
	/** Set function group F45 to F52. */
	FUNCTION_GRP_F45_F52 = 0x2b,
	/** Set function group F53 to F60. */
	FUNCTION_GRP_F53_F60 = 0x50,
	/** Set function group F61 to F68. */
	FUNCTION_GRP_F61_F68 = 0x51,
	/** Set function group F69 to F76. */
	LOCO_BINARY_STATE = 0x5f,
	/** Programming on the main */
	CV_POM = 0x30,
	/** Programming on the main Accessory */
	CV_POM_ACCESSORY = 0x31,
	/** Request the firmware version of  of the Z21 central. */
	FIRMWARE_VERSION = 0x0a,
	/** Drive command encoding for 14 speed steps. */
	LOCO_DRIVE_14 = 0x10,
	/** Drive command encoding for 28 speed steps. */
	LOCO_DRIVE_28 = 0x12,
	/** Drive command encoding for 128 speed steps. */
	LOCO_DRIVE_128 = 0x13
}
