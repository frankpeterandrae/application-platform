/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * LAN protocol headers used in Z21 communication.
 * These headers identify the type of message being sent over the LAN interface.
 */
export const enum Z21LanHeader {
	/** Request the Z21 central's serial number. */
	LAN_GET_SERIAL_NUMBER = 0x0010,
	/** Request software information from the Z21. TODO: add handling */
	LAN_GET_CODE = 0x0018,
	/** Request hardware information from the Z21. TODO: add handling */
	LAN_GET_HWINFO = 0x001a,
	/** Log off from the Z21 central station. */
	LAN_LOGOFF = 0x0030,
	/** LAN_X: Wrapper for X-BUS protocol commands. */
	LAN_X = 0x0040,
	/** Set broadcast flags to control which events the Z21 should send. */
	LAN_SET_BROADCASTFLAGS = 0x0050,
	/** Get current broadcast flags from the Z21. */
	LAN_GET_BROADCASTFLAGS = 0x0051,
	/** Request locomotive mode information. TODO: add handling */
	LAN_GET_LOCOMODE = 0x0060,
	/** Set locomotive mode information. TODO: add handling */
	LAN_SET_LOCOMODE = 0x0061,
	/** Get turnout mode information. TODO: add handling */
	LAN_GET_TURNOUTMODE = 0x0070,
	/** Set turnout mode information. TODO: add handling */
	LAN_SET_TURNOUTMODE = 0x0071,
	/** Notification that RM-Bus data has changed. TODO: add handling */
	LAN_RMBUS_DATACHANGED = 0x0080,
	/** Request RM-Bus data from the Z21. TODO: add handling */
	LAN_RMBUS_GETDATA = 0x0081,
	/** Program RM-Bus module information. TODO: add handling */
	LAN_RMBUS_PROGRAMMODULE = 0x0082,
	/** Notification that system state has changed. */
	LAN_SYSTEMSTATE_DATACHANGED = 0x0084,
	/** Request current system state snapshot from Z21. */
	LAN_SYSTEMSTATE_DATAGET = 0x0085,
	/** Notification that RAILCOM data has changed. TODO: add handling */
	LAN_RAILCOM_DATACHANGED = 0x0088,
	/** Request RAILCOM data from the Z21. TODO: add handling */
	LAN_RAILCOM_GETDATA = 0x0089,
	/** RX message for Loconet protocol data. TODO: add handling */
	LAN_LOCONET_Z21_RX = 0x00a0,
	/** TX message for Loconet protocol data. TODO: add handling */
	LAN_LOCONET_Z21_TX = 0x00a1,
	/** Message from LAN to Loconet protocol. TODO: add handling */
	LAN_LOCONET_FROM_LAN = 0x00a2,
	/** Dispatch address for Loconet protocol messages. TODO: add handling */
	LAN_LOCONET_DISPATCH_ADDR = 0x00a3,
	/** Detector message for Loconet protocol. TODO: add handling */
	LAN_LOCONET_DETECTOR = 0x00a4,
	/** Set track power state for LAN booster. TODO: add handling */
	LAN_BOOSTER_SET_POWER = 0x00b2,
	/** Get description for LAN booster devices. TODO: add handling */
	LAN_BOOSTER_GET_DESCRIPTION = 0x00b8,
	/** Set description for LAN booster devices. TODO: add handling */
	LAN_BOOSTER_SET_DESCRIPTION = 0x00b9,
	/** Notification that LAN booster system state has changed. TODO: add handling */
	LAN_BOOSTER_SYSTEMSTATE_DATACHANGED = 0x00ba,
	/** Request LAN booster system state data. TODO: add handling */
	LAN_BOOSTER_SYSTEMSTATE_GETDATA = 0x00bb,
	/** CAN protocol RX message. */
	LAN_CAN_DETECTOR = 0x00c4,
	/** CAN protocol TX message. */
	LAN_CAN_DEVICE_GET_DESCRIPTION = 0x00c8,
	/** CAN protocol device description message. TODO: add handling */
	LAN_CAN_DEVICE_SET_DESCRIPTION = 0x00c9,
	/** Notification that CAN booster system state has changed. TODO: add handling */
	LAN_CAN_BOOSTER_SYSTEMSTATE_CHGD = 0x00ca,
	/** Set track power state for CAN booster. TODO: add handling */
	LAN_CAN_BOOSTER_SET_TRACKPOWER = 0x00cb,
	/** Control fast clock settings for the LAN booster. TODO: add handling */
	LAN_FAST_CLOCK_CONTROL = 0x00cc,
	/** Get fast clock data from the LAN booster. TODO: add handling */
	LAN_FAST_CLOCK_DATA = 0x00cd,
	/** Request fast clock settings from the LAN booster. TODO: add handling */
	LAN_FAST_CLOCK_SETTINGS_GET = 0x00ce,
	/** Set fast clock settings for the LAN booster. TODO: add handling */
	LAN_FAST_CLOCK_SETTINGS_SET = 0x00cf,
	/** Get description for LAN decoder devices. TODO: add handling */
	LAN_DECODER_GET_DESCRIPTION = 0x00d8,
	/** Set description for LAN decoder devices. TODO: add handling */
	LAN_DECODER_SET_DESCRIPTION = 0x00d9,
	/** Notification that LAN decoder system state has changed. TODO: add handling */
	LAN_DECODER_SYSTEMSTATE_DATACHANGED = 0x00da,
	/** Request LAN decoder system state data. TODO: add handling */
	LAN_DECODER_SYSTEMSTATE_GETDATA = 0x00db,
	/** Get hardware information for Z21 Z-Link devices. TODO: add handling */
	LAN_ZLINK_GET_HWINFO = 0x00e8
}

/**
 * X-BUS protocol headers used within LAN_X wrapped messages.
 * These headers identify specific X-BUS command or event types.
 * Note: Same byte values may appear multiple times as they represent different
 * commands in different protocol contexts (e.g., 0x23 is both DCC_WRITE_REGISTER and CV_READ).
 */
/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
const enum XBusHeader {
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
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

/**
 * X-BUS locomotive command types.
 * Used in LOCO_DRIVE X-BUS header messages.
 * Note: Same byte values may appear multiple times as they represent different
 * commands in different protocol contexts (e.g., 0x12 is CV_NACK_SC, WRITE, and LOCO_DRIVE_28).
 */
/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
const enum XBusCmd {
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
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

/**
 * Options for Programming on the Main (POM) commands.
 * Used in CV_POM X-BUS header messages.
 */
const enum POM_Options {
	/** Read byte from CV */
	READ_BYTE = 0xe4,
	/** Write bit to CV */
	WRITE_BIT = 0xe8,
	/** Write byte to CV */
	WRITE_BYTE = 0xec
}

/**
 * Types of function switch commands for locomotives.
 * Used in LOCO_DRIVE X-BUS header messages.
 */
export const enum LocoFunctionSwitchType {
	/** Explicitly set function to off. */
	Off = 0b00,
	/** Explicitly set function to on. */
	On = 0b01,
	/** Toggle function state. */
	Toggle = 0b10
}

/**
 * Data values for status change notifications.
 * Used in STATUS_CHANGED X-BUS header messages.
 */
export const enum StatusChangedDb0 {
	/** Central station status change notification. */
	CentralStatus = 0x22
}

/**
 * Flags to configure which broadcast events the Z21 should send.
 * Used in LAN_SET_BROADCASTFLAGS messages.
 */
export const enum Z21BroadcastFlag {
	/** Disable all broadcasts. TODO: add handling */
	None = 0x00000000,
	/** Enable basic broadcasts (e.g., serial, power state). */
	Basic = 0x00000001,
	/** Enable system state broadcasts (comprehensive status frames). */
	SystemState = 0x00000100
}

/**
 * Bitmask for extracting the MSB portion of an X-BUS address byte.
 */
export const enum AddessByteMask {
	/** Upper 6 bits of a 14-bit locomotive address. */
	MSB = 0x3f
}

/**
 * Bitmask constants for interpreting speed/direction bytes in X-BUS commands.
 */
export const enum SpeedByteMask {
	/** Direction bit set for forward travel. */
	DIRECTION_FORWARD = 0x80,
	/** Direction bit cleared for reverse travel. */
	DIRECTION_REWARD = 0x00,
	/** Mask for the 7-bit speed value. */
	VALUE = 0x7f
}

/**
 * Bitmask constants for parsing locomotive info/status bytes.
 */
export const enum InfoByteMask {
	/** Märklin-Motorola locomotive indicator. */
	MM_LOCO = 0x10,
	/** Occupancy indicator. */
	OCCUPIED = 0x08,
	/** Mask for speed step encoding (14/28/128). */
	STEP = 0x07
}

/**
 * Bitmask constants for low (F0–F4) function bits in loco info bytes.
 */
export const enum LowFunctionsByteMask {
	F1 = 0x01,
	F2 = 0x02,
	F3 = 0x04,
	F4 = 0x08,
	/** Light/F0 flag. */
	L = 0x10,
	/** Smart search flag. */
	S = 0x20,
	/** Double traction flag. */
	D = 0x40
}

/**
 * Bitmask constants for function group F5–F12 in loco info bytes.
 */
export const enum F5ToF12FunctionsByteMask {
	F5 = 0x01,
	F6 = 0x02,
	F7 = 0x04,
	F8 = 0x08,
	F9 = 0x10,
	F10 = 0x20,
	F11 = 0x40,
	F12 = 0x80
}

/**
 * Bitmask constants for function group F13–F20 in loco info bytes.
 */
export const enum F13ToF20FunctionsByteMask {
	F13 = 0x01,
	F14 = 0x02,
	F15 = 0x04,
	F16 = 0x08,
	F17 = 0x10,
	F18 = 0x20,
	F19 = 0x40,
	F20 = 0x80
}

/**
 * Bitmask constants for function group F21–F28 in loco info bytes.
 */
export const enum F21ToF28FunctionsByteMask {
	F21 = 0x01,
	F22 = 0x02,
	F23 = 0x04,
	F24 = 0x08,
	F25 = 0x10,
	F26 = 0x20,
	F27 = 0x40,
	F28 = 0x80
}

/**
 * Bitmask constants for function group F29–F31 in loco info bytes.
 */
export const enum F29ToF31FunctionsByteMask {
	F29 = 0x01,
	F30 = 0x02,
	F31 = 0x04
}

/** Full-byte mask helper (0xff). */
export const FULL_BYTE_MASK = 0xff;

/**
 * LAN_X command structure.
 * All LAN_X commands consist of three components:
 * - LAN_X header (always 0x0040)
 * - XBusHeader (identifies the command category)
 * - XBusCmd or other sub-command (identifies the specific operation)
 */
export interface LanXCommand {
	/** The LAN header (always LAN_X = 0x0040) */
	readonly lanHeader: Z21LanHeader.LAN_X;
	/** The X-Bus header byte */
	readonly xBusHeader: XBusHeader;
	/** The X-Bus command/sub-command byte */
	readonly xBusCmd?: XBusCmd;
	/** Optional POM option for CV/POM commands */
	readonly option?: POM_Options;
}

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
	 * TODO: add handling
	 */
	LAN_X_GET_TURNOUT_INFO: {
		lanHeader: Z21LanHeader.LAN_X,
		xBusHeader: XBusHeader.TURNOUT_INFO
	} as const satisfies LanXCommand,
	/**
	 * Turnout information response.
	 * TODO: add handling
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
	 * TODO: add handling
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
