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

export const enum Z21BroadcastFlag {
	None = 0x00000000,
	Basic = 0x00000001,
	SystemState = 0x00000100
}
