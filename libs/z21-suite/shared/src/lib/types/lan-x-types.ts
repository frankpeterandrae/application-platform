/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type LanXCommand } from '../interfaces/lan-x-command';

import { POM_Options } from './pom-options';
import { XBusCmd } from './x-bus-cmd';
import { XHeader } from './x-header';

/**
 * Map of all LAN_X command combinations.
 * Structure: [LAN_X (0x0040), XHeader, XBusCmd]
 */
export const LAN_X_COMMANDS = {
	/**
	 * Get version of the Z21 central.
	 */
	LAN_X_GET_VERSION: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.GET_VERSION
	} as const satisfies LanXCommand,

	/**
	 * Get status of the Z21 central.
	 */
	LAN_X_GET_STATUS: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.GET_STATUS
	} as const satisfies LanXCommand,

	/**
	 * Set track power off.
	 */
	LAN_X_SET_TRACK_POWER_OFF: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.TRACK_POWER_OFF
	} as const satisfies LanXCommand,

	/**
	 * Set track power on.
	 */
	LAN_X_SET_TRACK_POWER_ON: {
		xHeader: XHeader.STATUS,
		xBusCmd: XBusCmd.TRACK_POWER_ON
	} as const satisfies LanXCommand,
	/**
	 * Read DCC CV register.
	 */
	LAN_X_DCC_READ_REGISTER: {
		xHeader: XHeader.DCC_READ_REGISTER,
		xBusCmd: XBusCmd.READ
	} as const satisfies LanXCommand,
	/**
	 * Read CV register.
	 * TODO: add handling
	 */
	LAN_X_CV_READ: {
		xHeader: XHeader.CV_READ,
		xBusCmd: XBusCmd.READ
	} as const satisfies LanXCommand,
	/**
	 * Write DCC CV register.
	 * TODO: add handling
	 */
	LAN_X_DCC_WRITE_REGISTER: {
		xHeader: XHeader.DCC_WRITE_REGISTER,
		xBusCmd: XBusCmd.WRITE
	} as const satisfies LanXCommand,
	/**
	 * Write CV register.
	 * TODO: add handling
	 */
	LAN_X_CV_WRITE: {
		xHeader: XHeader.CV_WRITE,
		xBusCmd: XBusCmd.WRITE
	} as const satisfies LanXCommand,
	/**
	 * Write byte to Märklin-Motorola decoder.
	 * TODO: add handling
	 */
	LAN_X_MM_WRITE_BYTE: {
		xHeader: XHeader.MM_WRITE_BYTE,
		xBusCmd: XBusCmd.MM_WRITE_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Get turnout information.
	 */
	LAN_X_GET_TURNOUT_INFO: {
		xHeader: XHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,
	/**
	 * Turnout information response.
	 */
	LAN_X_TURNOUT_INFO: {
		xHeader: XHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,
	/**
	 * Get extended accessory information.
	 * TODO: add handling
	 */
	LAN_X_GET_EXT_ACCESSORY_INFO: {
		xHeader: XHeader.EXT_ACCESSORY_INFO
	} as const satisfies LanXCommand,
	/**
	 * Extended accessory information response.
	 * TODO: add handling
	 */
	LAN_X_EXT_ACCESSORY_INFO: {
		xHeader: XHeader.EXT_ACCESSORY_INFO
	} as const satisfies LanXCommand,
	/**
	 * Set turnout state.
	 */
	LAN_X_SET_TURNOUT: {
		xHeader: XHeader.SET_TURNOUT
	} as const satisfies LanXCommand,
	/**
	 * Set extended accessory state.
	 * TODO: add handling
	 */
	LAN_X_SET_EXT_ACCESSORY: {
		xHeader: XHeader.SET_EXT_ACCESSORY
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: track power off.
	 */
	LAN_X_BC_TRACK_POWER_OFF: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_POWER_OFF
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: track power on.
	 */
	LAN_X_BC_TRACK_POWER_ON: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_POWER_ON
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: programming mode.
	 */
	LAN_X_BC_PROGRAMMING_MODE: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_BC_PROGRAMMING_MODE
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: track short circuit.
	 */
	LAN_X_BC_TRACK_SHORT_CIRCUIT: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_SHORT_CIRCUIT
	} as const satisfies LanXCommand,
	/**
	 * CV read NACK with short circuit.
	 * TODO: add handling
	 */
	LAN_X_CV_NACK_SC: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.CV_NACK_SC
	} as const satisfies LanXCommand,
	/**
	 * CV read NACK.
	 * TODO: add handling
	 */
	LAN_X_CV_NACK: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.CV_NACK
	} as const satisfies LanXCommand,
	/**
	 * Unknown command response.
	 * TODO: add handling
	 */
	LAN_X_UNKNOWN_COMMAND: {
		xHeader: XHeader.BROADCAST,
		xBusCmd: XBusCmd.UNKNOWN_COMMAND
	} as const satisfies LanXCommand,
	/**
	 * Status changed notification.
	 * TODO: add handling
	 */
	LAN_X_STATUS_CHANGED: {
		xHeader: XHeader.STATUS_CHANGED,
		xBusCmd: XBusCmd.STATUS_CHANGED
	} as const satisfies LanXCommand,
	/**
	 * Version information response.
	 */
	LAN_X_GET_VERSION_ANSWER: {
		xHeader: XHeader.VESION_ANSWER,
		xBusCmd: XBusCmd.GET_VERSION
	} as const satisfies LanXCommand,
	/**
	 * CV read result response.
	 * TODO: add handling
	 */
	LAN_X_CV_RESULT: {
		xHeader: XHeader.CV_RESULT,
		xBusCmd: XBusCmd.CV_RESULT
	} as const satisfies LanXCommand,
	/**
	 * Emergency stop for all locomotives.
	 */
	LAN_X_SET_STOP: {
		xHeader: XHeader.STOP
	} as const satisfies LanXCommand,
	/**
	 * Clear emergency stop for all locomotives.
	 */
	LAN_X_BC_STOPPED: {
		xHeader: XHeader.BC_STOP
	} as const satisfies LanXCommand,
	/**
	 * Emergency stop for specific locomotive.
	 */
	LAN_X_SET_LOCO_E_STOP: {
		xHeader: XHeader.LOCO_E_STOP
	} as const satisfies LanXCommand,
	/**
	 * Purge locomotive from slot.
	 * TODO: add handling
	 */
	LAN_X_PURGE_LOCO: {
		xHeader: XHeader.LOCO_INFO,
		xBusCmd: XBusCmd.PURGE_LOCO
	} as const satisfies LanXCommand,
	/**
	 * Request locomotive information.
	 */
	LAN_X_GET_LOCO_INFO: {
		xHeader: XHeader.LOCO_INFO,
		xBusCmd: XBusCmd.LOCO_INFO
	} as const satisfies LanXCommand,
	/**
	 * Drive locomotive with 14 speed steps.
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_DRIVE_14: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_14
	} as const satisfies LanXCommand,
	/**
	 * Drive locomotive with 28 speed steps.
	 */
	LAN_X_SET_LOCO_DRIVE_28: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_28
	} as const satisfies LanXCommand,
	/**
	 * Drive locomotive with 128 speed steps.
	 */
	LAN_X_SET_LOCO_DRIVE_128: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_128
	} as const satisfies LanXCommand,
	/**
	 * Set or toggle locomotive function.
	 */
	LAN_X_SET_LOCO_FUNCTION: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_FUNCTION
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F0 to F4
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F0_F4
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F5 to F8
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F5_F8
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F9 to F12
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F9_F12
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F13 to F20
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F13_F20
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F21 to F28
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F21_F28
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F29 to F36
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F29_F36
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F37 to F44
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F37_F44
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F45 to F52
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F45_F52
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F53 to F60
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F53_F60
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F61 to F68
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68: {
		xHeader: XHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F61_F68
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive binary state
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_BINARY_STATE: {
		xHeader: XHeader.LOCO_BINARY_STATE,
		xBusCmd: XBusCmd.LOCO_BINARY_STATE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main: write byte to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_WRITE_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.WRITE_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main: write bit to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_WRITE_BIT: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.WRITE_BIT
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main: read byte from CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_READ_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.READ_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main Accessory: write byte to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_ACCESSORY_WRITE_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.WRITE_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main Accessory: write bit to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_ACCESSORY_WRITE_BIT: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.WRITE_BIT
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main Accessory: read byte from CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_ACCESSORY_READ_BYTE: {
		xHeader: XHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.READ_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Loco info answer
	 */
	LAN_X_LOCO_INFO: {
		xHeader: XHeader.LOCO_INFO_ANSWER
	} as const satisfies LanXCommand,
	/**
	 * Get firmware xBusVersion of the Z21 central
	 */
	LAN_X_GET_FIRMWARE_VERSION: {
		xHeader: XHeader.FIRMWARE_VERSION,
		xBusCmd: XBusCmd.FIRMWARE_VERSION
	} as const satisfies LanXCommand,
	/**
	 * Firmware xBusVersion response
	 */
	LAN_X_GET_FIRMWARE_VERSION_ANSWER: {
		xHeader: XHeader.FIRMWARE_VERSION_ANSWER,
		xBusCmd: XBusCmd.FIRMWARE_VERSION
	} as const satisfies LanXCommand
} as const;
/**
 * Type representing all possible LAN_X command keys.
 */
export type LanXCommandKey = keyof typeof LAN_X_COMMANDS;
