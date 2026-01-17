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
