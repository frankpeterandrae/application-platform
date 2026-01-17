/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * X-BUS protocol headers used within LAN_X wrapped messages.
 * These headers identify specific X-BUS command or event types.
 * Note: Same byte values may appear multiple times as they represent different
 * commands in different protocol contexts (e.g., 0x23 is both DCC_WRITE_REGISTER and CV_READ).
 */
/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export const enum XHeader {
	/** Set track power ON/OFF */
	STATUS = 0x21,
	/** DCC: read CV register */
	DCC_READ_REGISTER = 0x22,
	/** DCC: write CV register */
	DCC_WRITE_REGISTER = 0x23,
	/** CV: read CV register */
	CV_READ = 0x23,
	/** CV: write CV register */
	CV_WRITE = 0x24,
	/** MM: read byte from decoder */
	MM_WRITE_BYTE = 0x24,
	/** Command: get turnout information */
	TURNOUT_INFO = 0x43,
	/** Command: get extended accessory information */
	EXT_ACCESSORY_INFO = 0x44,
	/** Command: set extended accessory state */
	SET_TURNOUT = 0x53,
	/** Command: set extended accessory state */
	SET_EXT_ACCESSORY = 0x54,
	/** Broadcast: track power state changed */
	BROADCAST = 0x61,
	/** Broadcast: general status changed */
	STATUS_CHANGED = 0x62,
	/** Response: version information */
	VESION_ANSWER = 0x63,
	/** Response: CV read result */
	CV_RESULT = 0x64,
	/** Command: emergency stop for all locomotives */
	STOP = 0x80,
	/** Command: clear emergency stop for all locomotives */
	BC_STOP = 0x81,
	/** Command: emergency stop for specific locomotive */
	LOCO_E_STOP = 0x92,
	/** Command: request loco information (followed by 0xF0 + addr) */
	LOCO_INFO = 0xe3,
	/** Command: drive locomotive (speed + direction) */
	LOCO_DRIVE = 0xe4,
	/** Command: set or toggle locomotive function (F0..Fn) */
	LOCO_BINARY_STATE = 0xe5,
	/** Programming on the main: read CV/POM */
	CV_POM = 0xe6,
	/** Event/Response: locomotive information (speed, dir, functions) */
	LOCO_INFO_ANSWER = 0xef,
	/** Event/Response: Z21 firmware version */
	FIRMWARE_VERSION = 0xf1,
	/** Event/Response: Z21 firmware version answer */
	FIRMWARE_VERSION_ANSWER = 0xf2
}
