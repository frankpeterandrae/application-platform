/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Types of function switch commands for locomotives.
 * Used in LOCO_DRIVE X-BUS header messages.
 */
export const enum LocoFunctionSwitchType {
	/** Explicitly set function to off. */
	OFF = 0b00,
	/** Explicitly set function to on. */
	ON = 0b01,
	/** Toggle function state. */
	TOGGLE = 0b10
}

/**
 * Flags to configure which broadcast events the Z21 should send.
 * Used in LAN_SET_BROADCASTFLAGS messages.
 */
export const enum Z21BroadcastFlag {
	/** Disable all broadcasts. */
	NONE = 0x00000000,
	/** Enable basic broadcasts (e.g., serial, power state). */
	BASIC = 0x00000001,
	/** Enable RM-BUS data broadcasts. */
	R_MBUS = 0x00000002,
	/** Enable RAILCOM data broadcasts. */
	RAILCOM = 0x00000004,
	/** Enable system state broadcasts (comprehensive status frames). */
	SYSTEM_STATE = 0x00000100,
	/** Enable locomotive info/status change broadcasts. */
	CHANGED_LOCO_INFO = 0x00010000,
	/** Enable turnout state change broadcasts. */
	LOCO_NET_WITHOUT_LOCO_AND_SWITCHES = 0x01000000,
	/** Enable broadcasts for locomotives and switches. */
	LOCO_NET_WITH_LOCO_AND_SWITCHES = 0x02000000,
	/** Enable dispatcher broadcasts. */
	LOCO_NET_DETECTOR = 0x08000000,
	/** Enable RM-BUS data change broadcasts. */
	RAILCOM_DATACHANGED = 0x00040000
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
