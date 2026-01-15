/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * LAN protocol headers used in Z21 communication.
 * These headers identify the type of message being sent over the LAN interface.
 */
export const enum Z21LanHeader {
	/** LAN_X: Wrapper for X-BUS protocol commands. */
	LAN_X = 0x0040,
	/** Request the Z21 central's serial number. */
	LAN_GET_SERIAL = 0x0010,
	/** Log off from the Z21 central station. */
	LAN_LOGOFF = 0x0030,
	/** Set broadcast flags to control which events the Z21 should send. */
	LAN_SET_BROADCASTFLAGS = 0x0050,
	/** Notification that system state has changed. */
	LAN_SYSTEMSTATE_DATACHANGED = 0x0084,
	/** Request current system state snapshot from Z21. */
	LAN_SYSTEMSTATE_DATAGET = 0x0085
}

/**
 * X-BUS protocol headers used within LAN_X wrapped messages.
 * These headers identify specific X-BUS command or event types.
 */
export const enum XBusHeader {
	/** Command to control track power (on/off). */
	TrackPower = 0x21,
	/** Broadcast notification of track power state change. */
	TrackPowerBroadcast = 0x61,
	/** Broadcast notification of a general status change event. */
	StatusChanged = 0x62,
	/** Command to request locomotive information. */
	GetLocoInfo = 0xe3,
	/** Command to drive a locomotive (speed/direction). */
	LocoDrive = 0xe4,
	/** Locomotive information or status query/response. */
	LocoInfo = 0xef
}

/**
 * X-BUS locomotive command types.
 * Used in LocoDrive X-BUS header messages.
 */
export const enum XBusLocoCmd {
	/** Set or toggle a locomotive function (F0..Fn). */
	SetLocoFunction = 0xf8,
	/** Drive command encoding for 14 speed steps. */
	SetLocoDrive_14 = 0x10,
	/** Drive command encoding for 28 speed steps. */
	SetLocoDrive_28 = 0x12,
	/** Drive command encoding for 128 speed steps. */
	SetLocoDrive_128 = 0x13,
	/** Request locomotive information. */
	GetLocoInfo = 0xf0
}

/**
 * Types of function switch commands for locomotives.
 * Used in LocoDrive X-BUS header messages.
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
 * Data values for track power control commands.
 * Used in TrackPower X-BUS header messages.
 */
export const enum TrackPowerValue {
	/** Turn track power off. */
	Off = 0x80,
	/** Turn track power on. */
	On = 0x81
}

/**
 * Data values for track power broadcast notifications.
 * Used in TrackPowerBroadcast X-BUS header messages.
 */
export const enum TrackPowerBroadcastValue {
	/** Track power is off. */
	Off = 0x00,
	/** Track power is on. */
	On = 0x01
}

/**
 * Data values for status change notifications.
 * Used in StatusChanged X-BUS header messages.
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
	/** Disable all broadcasts. */
	None = 0x00000000,
	/** Enable basic broadcasts (e.g., serial, power state). */
	Basic = 0x00000001,
	/** Enable system state broadcasts (comprehensive status frames). */
	SystemState = 0x00000100
}

export const enum AddessByteMask {
	MSB = 0x3f
}

export const enum SpeedByteMask {
	DIRECTION_FORWARD = 0x80,
	DIRECTION_REWARD = 0x00,
	VALUE = 0x7f
}

export const enum InfoByteMask {
	MM_LOCO = 0x10,
	OCCUPIED = 0x08,
	STEP = 0x07
}

export const enum LowFunctionsByteMask {
	F1 = 0x01,
	F2 = 0x02,
	F3 = 0x04,
	F4 = 0x08,
	L = 0x10,
	S = 0x20,
	D = 0x40
}

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

export const enum F29ToF31FunctionsByteMask {
	F29 = 0x01,
	F30 = 0x02,
	F31 = 0x04
}

export const FULL_BYTE_MASK = 0xff;
