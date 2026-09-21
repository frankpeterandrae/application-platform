/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, type LanXCommandKey } from './lan-x-types';

type ExpectedCommand = {
	xHeader: number;
	xBusCmd?: number;
	option?: number;
};

type CommandCase = readonly [command: LanXCommandKey, expected: ExpectedCommand];

const COMMAND_CASES = [
	// System / track power
	['LAN_X_GET_VERSION', { xHeader: 0x21, xBusCmd: 0x21 }],
	['LAN_X_GET_STATUS', { xHeader: 0x21, xBusCmd: 0x24 }],
	['LAN_X_SET_TRACK_POWER_OFF', { xHeader: 0x21, xBusCmd: 0x80 }],
	['LAN_X_SET_TRACK_POWER_ON', { xHeader: 0x21, xBusCmd: 0x81 }],

	// Service mode programming
	['LAN_X_DCC_READ_REGISTER', { xHeader: 0x22, xBusCmd: 0x11 }],
	['LAN_X_CV_READ', { xHeader: 0x23, xBusCmd: 0x11 }],
	['LAN_X_DCC_WRITE_REGISTER', { xHeader: 0x23, xBusCmd: 0x12 }],
	['LAN_X_CV_WRITE', { xHeader: 0x24, xBusCmd: 0x12 }],
	['LAN_X_MM_WRITE_BYTE', { xHeader: 0x24, xBusCmd: 0xff }],

	// Turnouts / accessories
	['LAN_X_GET_TURNOUT_INFO', { xHeader: 0x43 }],
	['LAN_X_TURNOUT_INFO', { xHeader: 0x43 }],
	['LAN_X_GET_EXT_ACCESSORY_INFO', { xHeader: 0x44 }],
	['LAN_X_EXT_ACCESSORY_INFO', { xHeader: 0x44 }],
	['LAN_X_SET_TURNOUT', { xHeader: 0x53 }],
	['LAN_X_SET_EXT_ACCESSORY', { xHeader: 0x54 }],

	// Broadcasts / responses
	['LAN_X_BC_TRACK_POWER_OFF', { xHeader: 0x61, xBusCmd: 0x00 }],
	['LAN_X_BC_TRACK_POWER_ON', { xHeader: 0x61, xBusCmd: 0x01 }],
	['LAN_X_BC_PROGRAMMING_MODE', { xHeader: 0x61, xBusCmd: 0x02 }],
	['LAN_X_BC_TRACK_SHORT_CIRCUIT', { xHeader: 0x61, xBusCmd: 0x08 }],
	['LAN_X_CV_NACK_SC', { xHeader: 0x61, xBusCmd: 0x12 }],
	['LAN_X_CV_NACK', { xHeader: 0x61, xBusCmd: 0x13 }],
	['LAN_X_UNKNOWN_COMMAND', { xHeader: 0x61, xBusCmd: 0x82 }],
	['LAN_X_STATUS_CHANGED', { xHeader: 0x62, xBusCmd: 0x22 }],
	['LAN_X_GET_VERSION_ANSWER', { xHeader: 0x63, xBusCmd: 0x21 }],
	['LAN_X_CV_RESULT', { xHeader: 0x64, xBusCmd: 0x14 }],

	// Emergency stop
	['LAN_X_SET_STOP', { xHeader: 0x80 }],
	['LAN_X_BC_STOPPED', { xHeader: 0x81 }],
	['LAN_X_SET_LOCO_E_STOP', { xHeader: 0x92 }],

	// Locomotive control
	['LAN_X_PURGE_LOCO', { xHeader: 0xe3, xBusCmd: 0x44 }],
	['LAN_X_GET_LOCO_INFO', { xHeader: 0xe3, xBusCmd: 0xf0 }],
	['LAN_X_SET_LOCO_DRIVE_14', { xHeader: 0xe4, xBusCmd: 0x10 }],
	['LAN_X_SET_LOCO_DRIVE_28', { xHeader: 0xe4, xBusCmd: 0x12 }],
	['LAN_X_SET_LOCO_DRIVE_128', { xHeader: 0xe4, xBusCmd: 0x13 }],
	['LAN_X_SET_LOCO_FUNCTION', { xHeader: 0xe4, xBusCmd: 0xf8 }],

	// Locomotive function groups
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4', { xHeader: 0xe4, xBusCmd: 0x20 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8', { xHeader: 0xe4, xBusCmd: 0x21 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12', { xHeader: 0xe4, xBusCmd: 0x22 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20', { xHeader: 0xe4, xBusCmd: 0x23 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28', { xHeader: 0xe4, xBusCmd: 0x28 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36', { xHeader: 0xe4, xBusCmd: 0x29 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44', { xHeader: 0xe4, xBusCmd: 0x2a }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52', { xHeader: 0xe4, xBusCmd: 0x2b }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60', { xHeader: 0xe4, xBusCmd: 0x50 }],
	['LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68', { xHeader: 0xe4, xBusCmd: 0x51 }],
	['LAN_X_SET_LOCO_BINARY_STATE', { xHeader: 0xe5, xBusCmd: 0x5f }],

	// Programming on Main
	['LAN_X_CV_POM_WRITE_BYTE', { xHeader: 0xe6, xBusCmd: 0x30, option: 0xec }],
	['LAN_X_CV_POM_WRITE_BIT', { xHeader: 0xe6, xBusCmd: 0x30, option: 0xe8 }],
	['LAN_X_CV_POM_READ_BYTE', { xHeader: 0xe6, xBusCmd: 0x30, option: 0xe4 }],
	['LAN_X_CV_POM_ACCESSORY_WRITE_BYTE', { xHeader: 0xe6, xBusCmd: 0x31, option: 0xec }],
	['LAN_X_CV_POM_ACCESSORY_WRITE_BIT', { xHeader: 0xe6, xBusCmd: 0x31, option: 0xe8 }],
	['LAN_X_CV_POM_ACCESSORY_READ_BYTE', { xHeader: 0xe6, xBusCmd: 0x31, option: 0xe4 }],

	// Information responses
	['LAN_X_LOCO_INFO', { xHeader: 0xef }],
	['LAN_X_GET_FIRMWARE_VERSION', { xHeader: 0xf1, xBusCmd: 0x0a }],
	['LAN_X_GET_FIRMWARE_VERSION_ANSWER', { xHeader: 0xf3, xBusCmd: 0x0a }]
] as const satisfies readonly CommandCase[];

describe('LAN_X_COMMANDS', () => {
	it.each(COMMAND_CASES)('%s uses the expected protocol bytes', (command, expected) => {
		expect(LAN_X_COMMANDS[command]).toEqual(expected);
	});

	it('has a protocol expectation for every defined command', () => {
		const testedCommands = COMMAND_CASES.map(([command]) => command).sort();
		const definedCommands = Object.keys(LAN_X_COMMANDS).sort();

		expect(testedCommands).toEqual(definedCommands);
	});
});
