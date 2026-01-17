import { type LanXCommand } from './lan-x-command';
import { POM_Options } from './pom-options';
import { XBusCmd } from './x-bus-cmd';
import { XBusHeader } from './x-bus-header';
import { Z21LanHeader } from './z21-lan-header';

/**
 * Map of all LAN_X command combinations.
 * Structure: [LAN_X (0x0040), XBusHeader, XBusCmd]
 */
export const LAN_X_COMMANDS = {
	/**
	 * Get version of the Z21 central.
	 * TODO: add handling
	 */
	LAN_X_GET_VERSION: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.STATUS,
		xBusCmd: XBusCmd.GET_VERSION
	} as const satisfies LanXCommand,

	/**
	 * Get status of the Z21 central.
	 * TODO: add handling
	 */
	LAN_X_GET_STATUS: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.STATUS,
		xBusCmd: XBusCmd.GET_STATUS
	} as const satisfies LanXCommand,

	/**
	 * Set track power off.
	 */
	LAN_X_SET_TRACK_POWER_OFF: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.STATUS,
		xBusCmd: XBusCmd.TRACK_POWER_OFF
	} as const satisfies LanXCommand,

	/**
	 * Set track power on.
	 */
	LAN_X_SET_TRACK_POWER_ON: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.STATUS,
		xBusCmd: XBusCmd.TRACK_POWER_ON
	} as const satisfies LanXCommand,
	/**
	 * Read DCC CV register.
	 * TODO: add handling
	 */
	LAN_X_DCC_READ_REGISTER: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.DCC_READ_REGISTER,
		xBusCmd: XBusCmd.READ
	} as const satisfies LanXCommand,
	/**
	 * Read CV register.
	 * TODO: add handling
	 */
	LAN_X_CV_READ: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_READ,
		xBusCmd: XBusCmd.READ
	} as const satisfies LanXCommand,
	/**
	 * Write DCC CV register.
	 * TODO: add handling
	 */
	LAN_X_DCC_WRITE_REGISTER: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.DCC_WRITE_REGISTER,
		xBusCmd: XBusCmd.WRITE
	} as const satisfies LanXCommand,
	/**
	 * Write CV register.
	 * TODO: add handling
	 */
	LAN_X_CV_WRITE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_WRITE,
		xBusCmd: XBusCmd.WRITE
	} as const satisfies LanXCommand,
	/**
	 * Write byte to Märklin-Motorola decoder.
	 * TODO: add handling
	 */
	LAN_X_MM_WRITE_BYTE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.MM_WRITE_BYTE,
		xBusCmd: XBusCmd.MM_WRITE_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Get turnout information.
	 */
	LAN_X_GET_TURNOUT_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,
	/**
	 * Turnout information response.
	 */
	LAN_X_TURNOUT_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,
	/**
	 * Get extended accessory information.
	 * TODO: add handling
	 */
	LAN_X_GET_EXT_ACCESSORY_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.EXT_ACCESSORY_INFO
	} as const satisfies LanXCommand,
	/**
	 * Extended accessory information response.
	 * TODO: add handling
	 */
	LAN_X_EXT_ACCESSORY_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.EXT_ACCESSORY_INFO
	} as const satisfies LanXCommand,
	/**
	 * Set turnout state.
	 */
	LAN_X_SET_TURNOUT: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.SET_TURNOUT
	} as const satisfies LanXCommand,
	/**
	 * Set extended accessory state.
	 * TODO: add handling
	 */
	LAN_X_SET_EXT_ACCESSORY: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.SET_EXT_ACCESSORY
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: track power off.
	 * TODO: add handling
	 */
	LAN_X_BC_TRACK_POWER_OFF: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_POWER_OFF
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: track power on.
	 * TODO: add handling
	 */
	LAN_X_BC_TRACK_POWER_ON: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_POWER_ON
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: programming mode.
	 * TODO: add handling
	 */
	LAN_X_BC_PROGRAMMING_MODE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_BC_PROGRAMMING_MODE
	} as const satisfies LanXCommand,
	/**
	 * Broadcast: track short circuit.
	 * TODO: add handling
	 */
	LAN_X_BC_TRACK_SHORT_CIRCUIT: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.BC_TRACK_SHORT_CIRCUIT
	} as const satisfies LanXCommand,
	/**
	 * CV read NACK with short circuit.
	 * TODO: add handling
	 */
	LAN_X_CV_NACK_SC: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.CV_NACK_SC
	} as const satisfies LanXCommand,
	/**
	 * CV read NACK.
	 * TODO: add handling
	 */
	LAN_X_CV_NACK: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.CV_NACK
	} as const satisfies LanXCommand,
	/**
	 * Unknown command response.
	 * TODO: add handling
	 */
	LAN_X_UNKNOWN_COMMAND: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BROADCAST,
		xBusCmd: XBusCmd.UNKNOWN_COMMAND
	} as const satisfies LanXCommand,
	/**
	 * Status changed notification.
	 * TODO: add handling
	 */
	LAN_X_STATUS_CHANGED: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.STATUS_CHANGED,
		xBusCmd: XBusCmd.STATUS_CHANGED
	} as const satisfies LanXCommand,
	/**
	 * Version information response.
	 * TODO: add handling
	 */
	LAN_X_GET_VERSION_ANSWER: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.VESION_ANSWER,
		xBusCmd: XBusCmd.GET_VERSION
	} as const satisfies LanXCommand,
	/**
	 * CV read result response.
	 * TODO: add handling
	 */
	LAN_X_CV_RESULT: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_RESULT,
		xBusCmd: XBusCmd.CV_RESULT
	} as const satisfies LanXCommand,
	/**
	 * Emergency stop for all locomotives.
	 */
	LAN_X_SET_STOP: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.STOP
	} as const satisfies LanXCommand,
	/**
	 * Clear emergency stop for all locomotives.
	 * TODO: add handling
	 */
	LAN_X_BC_STOPPED: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.BC_STOP
	} as const satisfies LanXCommand,
	/**
	 * Emergency stop for specific locomotive.
	 */
	LAN_X_SET_LOCO_E_STOP: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_E_STOP
	} as const satisfies LanXCommand,
	/**
	 * Purge locomotive from slot.
	 * TODO: add handling
	 */
	LAN_X_PURGE_LOCO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_INFO,
		xBusCmd: XBusCmd.PURGE_LOCO
	} as const satisfies LanXCommand,
	/**
	 * Request locomotive information.
	 */
	LAN_X_GET_LOCO_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_INFO,
		xBusCmd: XBusCmd.LOCO_INFO
	} as const satisfies LanXCommand,
	/**
	 * Drive locomotive with 14 speed steps.
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_DRIVE_14: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_14
	} as const satisfies LanXCommand,
	/**
	 * Drive locomotive with 28 speed steps.
	 */
	LAN_X_SET_LOCO_DRIVE_28: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_28
	} as const satisfies LanXCommand,
	/**
	 * Drive locomotive with 128 speed steps.
	 */
	LAN_X_SET_LOCO_DRIVE_128: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_DRIVE_128
	} as const satisfies LanXCommand,
	/**
	 * Set or toggle locomotive function.
	 */
	LAN_X_SET_LOCO_FUNCTION: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.LOCO_FUNCTION
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F0 to F4
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F0_F4
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F5 to F8
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F5_F8
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F9 to F12
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F9_F12
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F13 to F20
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F13_F20
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F21 to F28
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F21_F28
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F29 to F36
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F29_F36
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F37 to F44
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F37_F44
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F45 to F52
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F45_F52
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F53 to F60
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F53_F60
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive functions F61 to F68
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_DRIVE,
		xBusCmd: XBusCmd.FUNCTION_GRP_F61_F68
	} as const satisfies LanXCommand,
	/**
	 * Set locomotive binary state
	 * TODO: add handling
	 */
	LAN_X_SET_LOCO_BINARY_STATE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_BINARY_STATE,
		xBusCmd: XBusCmd.LOCO_BINARY_STATE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main: write byte to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_WRITE_BYTE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.WRITE_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main: write bit to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_WRITE_BIT: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.WRITE_BIT
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main: read byte from CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_READ_BYTE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM,
		option: POM_Options.READ_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main Accessory: write byte to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_ACCESSORY_WRITE_BYTE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.WRITE_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main Accessory: write bit to CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_ACCESSORY_WRITE_BIT: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.WRITE_BIT
	} as const satisfies LanXCommand,
	/**
	 * Programming on the main Accessory: read byte from CV
	 * TODO: add handling
	 */
	LAN_X_CV_POM_ACCESSORY_READ_BYTE: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.CV_POM,
		xBusCmd: XBusCmd.CV_POM_ACCESSORY,
		option: POM_Options.READ_BYTE
	} as const satisfies LanXCommand,
	/**
	 * Loco info answer
	 */
	LAN_X_LOCO_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.LOCO_INFO_ANSWER
	} as const satisfies LanXCommand,
	/**
	 * Get firmware version of the Z21 central
	 * TODO: add handling
	 */
	LAN_X_GET_FIRMWARE_VERSION: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.FIRMWARE_VERSION,
		xBusCmd: XBusCmd.FIRMWARE_VERSION
	} as const satisfies LanXCommand,
	/**
	 * Firmware version response
	 * TODO: add handling
	 */
	LAN_X_GET_FIRMWARE_VERSION_ANSWER: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.FIRMWARE_VERSION_ANSWER,
		xBusCmd: XBusCmd.FIRMWARE_VERSION
	} as const satisfies LanXCommand
} as const;
/**
 * Type representing all possible LAN_X command keys.
 */
export type LanXCommandKey = keyof typeof LAN_X_COMMANDS;
