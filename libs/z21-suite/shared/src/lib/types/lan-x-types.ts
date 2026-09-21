/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type LanXCommand } from '../interfaces/lan-x-command';

import { POM_Options } from './pom-options';
import { XBusCmd } from './x-bus-cmd';
import { XHeader } from './x-header';

/**
 * Maps supported LAN-X command combinations to their protocol bytes.
 *
 * LAN-X frames use the Z21 LAN header 0x0040 followed by an X-Bus header
 * and, depending on the command, an X-Bus sub-command or POM option.
 */
export const LAN_X_COMMANDS = {
	/** Requests the X-Bus version from the command station. */
	LAN_X_GET_VERSION: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.GET_VERSION
	} as const satisfies LanXCommand,

	/** Requests the current command station status. */
	LAN_X_GET_STATUS: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.GET_STATUS
	} as const satisfies LanXCommand,

	/** Switches track power off. */
	LAN_X_SET_TRACK_POWER_OFF: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.TRACK_POWER_OFF
	} as const satisfies LanXCommand,

	/** Switches track power on. */
	LAN_X_SET_TRACK_POWER_ON: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.TRACK_POWER_ON
	} as const satisfies LanXCommand,

	/** Read DCC CV register. */
	LAN_X_DCC_READ_REGISTER: {
		xHeader: XHeader.DCC_READ_REGISTER,
		xBusCmd: XBusCmd.READ
	} as const satisfies LanXCommand,

	/**
	 * Read CV register.
	 * Format: 23 11 <CV_MSB> <CV_LSB> <XOR>
	 */
	LAN_X_CV_READ: {
		xHeader: XHeader.CV_READ,
		xBusCmd: XBusCmd.READ
	} as const satisfies LanXCommand,

	/** Write DCC CV register. */
	LAN_X_DCC_WRITE_REGISTER: {
		xHeader: XHeader.DCC_WRITE_REGISTER,
		xBusCmd: XBusCmd.WRITE
	} as const satisfies LanXCommand,

	/**
	 * Write CV register.
	 * Format: 24 12 <CV_MSB> <CV_LSB> <VALUE> <XOR>
	 */
	LAN_X_CV_WRITE: {
		xHeader: XHeader.CV_WRITE,
		xBusCmd: XBusCmd.WRITE
	} as const satisfies LanXCommand,

	/** Write byte to Märklin-Motorola decoder. */
	LAN_X_MM_WRITE_BYTE: {
		xHeader: XHeader.MM_WRITE_BYTE,
		xBusCmd: XBusCmd.MM_WRITE_BYTE
	} as const satisfies LanXCommand,

	/** Get turnout information. */
	LAN_X_GET_TURNOUT_INFO: {
		xHeader: XHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,

	/** Turnout information response. */
	LAN_X_TURNOUT_INFO: {
		xHeader: XHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,

	/** Get extended accessory information. */
	LAN_X_GET_EXT_ACCESSORY_INFO: {
		xHeader: XHeader.EXT_ACCESSORY_INFO
	} as const satisfies LanXCommand,

	/** Extended accessory information response. */
	LAN_X_EXT_ACCESSORY_INFO: {
		xHeader: XHeader.EXT_ACCESSORY_INFO
	} as const satisfies LanXCommand,

	/** Set turnout state. */
	LAN_X_SET_TURNOUT: {
		xHeader: XHeader.SET_TURNOUT
	} as const satisfies LanXCommand,

	/** Set extended accessory state. */
	LAN_X_SET_EXT_ACCESSORY: {
		xHeader: XHeader.SET_EXT_ACCESSORY
	} as const satisfies LanXCommand,

	/** Reports that track power was switched off. */
	LAN_X_BC_TRACK_POWER_OFF: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_POWER_OFF
	} as const satisfies LanXCommand,

	/** Reports that track power was switched on. */
	LAN_X_BC_TRACK_POWER_ON: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_POWER_ON
	} as const satisfies LanXCommand,

	/** Reports that the command station entered programming mode. */
	LAN_X_BC_PROGRAMMING_MODE: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_PROGRAMMING_MODE
	} as const satisfies LanXCommand,

	/** Reports a track short circuit. */
	LAN_X_BC_TRACK_SHORT_CIRCUIT: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_SHORT_CIRCUIT
	} as const satisfies LanXCommand,

	/** Reports a CV programming NACK caused by a short circuit. */
	LAN_X_CV_NACK_SC: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.CV_NACK_SC
	} as const satisfies LanXCommand,

	/** Reports a CV programming NACK. */
	LAN_X_CV_NACK: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.CV_NACK
	} as const satisfies LanXCommand,

	/** Reports an unknown or invalid LAN-X command. */
	LAN_X_UNKNOWN_COMMAND: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.UNKNOWN_COMMAND
	} as const satisfies LanXCommand,

	/** Reports a command station status change. */
	LAN_X_STATUS_CHANGED: {
		xHeader: XHeader.STATUS_CHANGED,
		xBusCmd: XBusCmd.STATUS_CHANGED
	} as const satisfies LanXCommand,

	/** Reports X-Bus version information. */
	LAN_X_GET_VERSION_ANSWER: {
		xHeader: XHeader.VERSION_ANSWER,
		xBusCmd: XBusCmd.GET_VERSION
	} as const satisfies LanXCommand,

	/** Reports the result of a CV programming operation. */
	LAN_X_CV_RESULT: {
		xHeader: XHeader.CV_RESULT,
		xBusCmd: XBusCmd.CV_RESULT
	} as const satisfies LanXCommand,

	/** Emergency stop for all locomotives. */
	LAN_X_SET_STOP: {
		xHeader: XHeader.STOP
	} as const satisfies LanXCommand,

	/** Clear emergency stop for all locomotives. */
	LAN_X_BC_STOPPED: {
		xHeader: XHeader.BC_STOP
	} as const satisfies LanXCommand,

	/** Emergency stop for specific locomotive. */
	LAN_X_SET_LOCO_E_STOP: {
		xHeader: XHeader.LOCO_E_STOP
	} as const satisfies LanXCommand,

	/** Purge locomotive from slot. */
	LAN_X_PURGE_LOCO: {
		xHeader: XHeader.LOCO_INFO,
		xBusCmd: XBusCmd.PURGE_LOCO
	} as const satisfies LanXCommand,

	/** Request locomotive information. */
	LAN_X_GET_LOCO_INFO: {
		xHeader: XHeader.LOCO_INFO,
		xBusCmd: XBusCmd.LOCO_INFO
	} as const satisfies LanXCommand,

	/** Drive locomotive with 14 speed steps. */
	LAN_X_SET_LOCO_DRIVE_14: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_14
	} as const satisfies LanXCommand,

	/** Drive locomotive with 28 speed steps. */
	LAN_X_SET_LOCO_DRIVE_28: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_28
	} as const satisfies LanXCommand,

	/** Drive locomotive with 128 speed steps. */
	LAN_X_SET_LOCO_DRIVE_128: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_128
	} as const satisfies LanXCommand,

	/** Set or toggle locomotive function. */
	LAN_X_SET_LOCO_FUNCTION: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_FUNCTION
	} as const satisfies LanXCommand,

	/** Set locomotive functions F0 to F4. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F0_F4
	} as const satisfies LanXCommand,

	/** Set locomotive functions F5 to F8. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F5_F8
	} as const satisfies LanXCommand,

	/** Set locomotive functions F9 to F12. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F9_F12
	} as const satisfies LanXCommand,

	/** Set locomotive functions F13 to F20. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F13_F20
	} as const satisfies LanXCommand,

	/** Set locomotive functions F21 to F28. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F21_F28
	} as const satisfies LanXCommand,

	/** Set locomotive functions F29 to F36. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F29_F36
	} as const satisfies LanXCommand,

	/** Set locomotive functions F37 to F44. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F37_F44
	} as const satisfies LanXCommand,

	/** Set locomotive functions F45 to F52. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F45_F52
	} as const satisfies LanXCommand,

	/** Set locomotive functions F53 to F60. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F53_F60
	} as const satisfies LanXCommand,

	/** Set locomotive functions F61 to F68. */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F61_F68
	} as const satisfies LanXCommand,

	/** Set locomotive binary state. */
	LAN_X_SET_LOCO_BINARY_STATE: {
		xHeader: XHeader.LOCO_BINARY_STATE,
		xBusCmd: XBusCmd.LOCO_BINARY_STATE
	} as const satisfies LanXCommand,

	/** Programming on Main: write byte to CV */
	LAN_X_CV_POM_WRITE_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.WRITE_BYTE
	} as const satisfies LanXCommand,

	/** Programming on Main: write bit to CV */
	LAN_X_CV_POM_WRITE_BIT: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.WRITE_BIT
	} as const satisfies LanXCommand,

	/** Programming on Main: read byte from CV */
	LAN_X_CV_POM_READ_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.READ_BYTE
	} as const satisfies LanXCommand,

	/** Programming on Main for an accessory: write byte to CV */
	LAN_X_CV_POM_ACCESSORY_WRITE_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.WRITE_BYTE
	} as const satisfies LanXCommand,

	/** Programming on Main for an accessory: write bit to CV */
	LAN_X_CV_POM_ACCESSORY_WRITE_BIT: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.WRITE_BIT
	} as const satisfies LanXCommand,

	/** Programming on Main for an accessory: read byte from CV */
	LAN_X_CV_POM_ACCESSORY_READ_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.READ_BYTE
	} as const satisfies LanXCommand,

	/** Reports locomotive state information. */
	LAN_X_LOCO_INFO: {
		xHeader: XHeader.LOCO_INFO_ANSWER
	} as const satisfies LanXCommand,

	/** Requests the command station firmware version. */
	LAN_X_GET_FIRMWARE_VERSION: {
		xHeader: XHeader.FIRMWARE_VERSION,
		xBusCmd: XBusCmd.FIRMWARE_VERSION
	} as const satisfies LanXCommand,

	/** Reports the command station firmware version. */
	LAN_X_GET_FIRMWARE_VERSION_ANSWER: {
		xHeader: XHeader.FIRMWARE_VERSION_ANSWER,
		xBusCmd: XBusCmd.FIRMWARE_VERSION
	} as const satisfies LanXCommand
} as const;

/**
 * Type representing all possible LAN_X command keys.
 */
export type LanXCommandKey = keyof typeof LAN_X_COMMANDS;
