/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * LAN headers used by the Z21 protocol.
 * Each value identifies the payload type of a Z21 LAN frame.
 */
export const enum Z21LanHeader {
	/** Requests the command station serial number. */
	LAN_GET_SERIAL_NUMBER = 0x0010,

	/** Requests command station software information. */
	LAN_GET_CODE = 0x0018,

	/** Requests command station hardware information. */
	LAN_GET_HWINFO = 0x001a,

	/** Logs off from the command station. */
	LAN_LOGOFF = 0x0030,

	/** Wraps an X-BUS command in a Z21 LAN frame. */
	LAN_X = 0x0040,

	/** Sets the broadcast flags that control which events the command station sends. */
	LAN_SET_BROADCASTFLAGS = 0x0050,

	/** Requests the current broadcast flags. */
	LAN_GET_BROADCASTFLAGS = 0x0051,

	/** Request locomotive mode information. */
	LAN_GET_LOCOMODE = 0x0060,

	/** Set locomotive mode information. */
	LAN_SET_LOCOMODE = 0x0061,

	/** Get turnout mode information. */
	LAN_GET_TURNOUTMODE = 0x0070,

	/** Set turnout mode information. */
	LAN_SET_TURNOUTMODE = 0x0071,

	/** Notification that RM-Bus data has changed. */
	LAN_RMBUS_DATACHANGED = 0x0080,

	/** Request RM-Bus data from the Z21. */
	LAN_RMBUS_GETDATA = 0x0081,

	/** Program RM-Bus module information. */
	LAN_RMBUS_PROGRAMMODULE = 0x0082,

	/** Notification that system state has changed. */
	LAN_SYSTEMSTATE_DATACHANGED = 0x0084,

	/** Requests the current system state snapshot. */
	LAN_SYSTEMSTATE_GETDATA = 0x0085,

	/** Notification that RAILCOM data has changed. */
	LAN_RAILCOM_DATACHANGED = 0x0088,

	/** Request RAILCOM data from the Z21. */
	LAN_RAILCOM_GETDATA = 0x0089,

	/** RX message for Loconet protocol data. */
	LAN_LOCONET_Z21_RX = 0x00a0,

	/** TX message for Loconet protocol data. */
	LAN_LOCONET_Z21_TX = 0x00a1,

	/** Message from LAN to Loconet protocol. */
	LAN_LOCONET_FROM_LAN = 0x00a2,

	/** Dispatch address for Loconet protocol messages. */
	LAN_LOCONET_DISPATCH_ADDR = 0x00a3,

	/** Detector message for Loconet protocol. */
	LAN_LOCONET_DETECTOR = 0x00a4,

	/** Set track power state for LAN booster. */
	LAN_BOOSTER_SET_POWER = 0x00b2,

	/** Get description for LAN booster devices. */
	LAN_BOOSTER_GET_DESCRIPTION = 0x00b8,

	/** Set description for LAN booster devices. */
	LAN_BOOSTER_SET_DESCRIPTION = 0x00b9,

	/** Notification that LAN booster system state has changed. */
	LAN_BOOSTER_SYSTEMSTATE_DATACHANGED = 0x00ba,

	/** Request LAN booster system state data. */
	LAN_BOOSTER_SYSTEMSTATE_GETDATA = 0x00bb,

	/** CAN protocol RX message. */
	LAN_CAN_DETECTOR = 0x00c4,

	/** CAN protocol TX message. */
	LAN_CAN_DEVICE_GET_DESCRIPTION = 0x00c8,

	/** CAN protocol device description message. */
	LAN_CAN_DEVICE_SET_DESCRIPTION = 0x00c9,

	/** Notification that CAN booster system state has changed. */
	LAN_CAN_BOOSTER_SYSTEMSTATE_CHGD = 0x00ca,

	/** Set track power state for CAN booster. */
	LAN_CAN_BOOSTER_SET_TRACKPOWER = 0x00cb,

	/** Control fast clock settings for the LAN booster. */
	LAN_FAST_CLOCK_CONTROL = 0x00cc,

	/** Get fast clock data from the LAN booster. */
	LAN_FAST_CLOCK_DATA = 0x00cd,

	/** Request fast clock settings from the LAN booster. */
	LAN_FAST_CLOCK_SETTINGS_GET = 0x00ce,

	/** Set fast clock settings for the LAN booster. */
	LAN_FAST_CLOCK_SETTINGS_SET = 0x00cf,

	/** Get description for LAN decoder devices. */
	LAN_DECODER_GET_DESCRIPTION = 0x00d8,

	/** Set description for LAN decoder devices. */
	LAN_DECODER_SET_DESCRIPTION = 0x00d9,

	/** Notification that LAN decoder system state has changed. */
	LAN_DECODER_SYSTEMSTATE_DATACHANGED = 0x00da,

	/** Request LAN decoder system state data. */
	LAN_DECODER_SYSTEMSTATE_GETDATA = 0x00db,

	/** Get hardware information for Z21 Z-Link devices. */
	LAN_ZLINK_GET_HWINFO = 0x00e8
}
