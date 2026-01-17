/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS } from '@application-platform/z21-shared';

describe('LAN_X_COMMANDS Map', () => {
	describe('Locomotive Control Commands', () => {
		it('should have correct structure for SET_LOCO_FUNCTION (0x0040 0xE4 0xF8)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;

			expect(cmd.lanHeader).toBe(0x0040); // 0x0040
			expect(cmd.xBusHeader).toBe(0xe4); // 0xE4
			expect(cmd.xBusCmd).toBe(0xf8); // 0xF8
		});

		it('should have correct structure for SET_LOCO_DRIVE_14 (0x0040 0xE4 0x10)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_14;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x10);
		});

		it('should have correct structure for SET_LOCO_DRIVE_28 (0x0040 0xE4 0x12)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_28;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x12);
		});

		it('should have correct structure for SET_LOCO_DRIVE_128 (0x0040 0xE4 0x13)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x13);
		});

		it('should have correct structure for LOCO_INFO (0x0040 0xE3 0xF0)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe3);
			expect(cmd.xBusCmd).toBe(0xf0);
		});

		it('should have correct structure for LOCO_E_STOP', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_E_STOP;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x92);
		});

		it('should have correct structure for PURGE_LOCO', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_PURGE_LOCO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe3);
			expect(cmd.xBusCmd).toBe(0x44);
		});
	});

	describe('Track Power / Status Commands', () => {
		it('should have correct structure for SET_TRACK_POWER_OFF (0x0040 0x21 0x80)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x21);
			expect(cmd.xBusCmd).toBe(0x80);
		});

		it('should have correct structure for SET_TRACK_POWER_ON (0x0040 0x21 0x81)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x21);
			expect(cmd.xBusCmd).toBe(0x81);
		});

		it('should have correct structure for GET_VERSION (0x0040 0x21 0x21)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_VERSION;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x21);
			expect(cmd.xBusCmd).toBe(0x21);
		});

		it('should have correct structure for GET_STATUS (0x0040 0x21 0x24)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_STATUS;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x21);
			expect(cmd.xBusCmd).toBe(0x24);
		});
	});

	describe('Programming (CV) Commands', () => {
		it('should have correct structure for DCC_READ_CV (0x0040 0x22 0x11)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_DCC_READ_REGISTER;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x22);
			expect(cmd.xBusCmd).toBe(0x11);
		});

		it('should have correct structure for DCC_WRITE_CV (0x0040 0x23 0x12)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_DCC_WRITE_REGISTER;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x23);
			expect(cmd.xBusCmd).toBe(0x12);
		});

		it('should have correct structure for MM_WRITE_BYTE (0x0040 0x24 0xFF)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_MM_WRITE_BYTE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x24);
			expect(cmd.xBusCmd).toBe(0xff);
		});
	});

	describe('Turnout / Accessory Commands', () => {
		it('should have correct structure for GET_TURNOUT_INFO (0x0040 0x43)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x43);
		});

		it('should have correct structure for GET_EXT_ACCESSORY_INFO (0x0040 0x44)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_EXT_ACCESSORY_INFO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x44);
		});

		it('should have correct structure for SET_EXT_ACCESSORY (0x0040 0x54)', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_EXT_ACCESSORY;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x54);
		});
	});

	describe('Broadcast Commands', () => {
		it('should have correct structure for BC_TRACK_POWER_OFF', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_BC_TRACK_POWER_OFF;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x00);
		});

		it('should have correct structure for BC_TRACK_POWER_ON', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_BC_TRACK_POWER_ON;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x01);
		});

		it('should have correct structure for BC_PROGRAMMING_MODE', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_BC_PROGRAMMING_MODE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x02);
		});

		it('should have correct structure for BC_TRACK_SHORT_CIRCUIT', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_BC_TRACK_SHORT_CIRCUIT;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x08);
		});
	});

	describe('CV/POM Commands', () => {
		it('should have correct structure for CV_READ', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_READ;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x23);
			expect(cmd.xBusCmd).toBe(0x11);
		});

		it('should have correct structure for CV_WRITE', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_WRITE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x24);
			expect(cmd.xBusCmd).toBe(0x12);
		});

		it('should have POM_WRITE_BYTE with option set', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_POM_WRITE_BYTE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe6);
			expect(cmd.xBusCmd).toBe(0x30);
			expect(cmd.option).toBe(0xec);
		});

		it('should have POM_WRITE_BIT with option set', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_POM_WRITE_BIT;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe6);
			expect(cmd.xBusCmd).toBe(0x30);
			expect(cmd.option).toBe(0xe8);
		});

		it('should have POM_READ_BYTE with option set', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_POM_READ_BYTE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe6);
			expect(cmd.xBusCmd).toBe(0x30);
			expect(cmd.option).toBe(0xe4);
		});

		it('should have POM_ACCESSORY_WRITE_BYTE with option set', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_POM_ACCESSORY_WRITE_BYTE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe6);
			expect(cmd.xBusCmd).toBe(0x31);
			expect(cmd.option).toBe(0xec);
		});

		it('should have POM_ACCESSORY_WRITE_BIT with option set', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_POM_ACCESSORY_WRITE_BIT;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe6);
			expect(cmd.xBusCmd).toBe(0x31);
			expect(cmd.option).toBe(0xe8);
		});

		it('should have POM_ACCESSORY_READ_BYTE with option set', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_POM_ACCESSORY_READ_BYTE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe6);
			expect(cmd.xBusCmd).toBe(0x31);
			expect(cmd.option).toBe(0xe4);
		});
	});

	describe('Locomotive Function Group Commands', () => {
		it('should have correct structure for FUNCTION_GROUP_F0_F4', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x20);
		});

		it('should have correct structure for FUNCTION_GROUP_F5_F8', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x21);
		});

		it('should have correct structure for FUNCTION_GROUP_F9_F12', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x22);
		});

		it('should have correct structure for FUNCTION_GROUP_F13_F20', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x23);
		});

		it('should have correct structure for FUNCTION_GROUP_F21_F28', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x28);
		});

		it('should have correct structure for FUNCTION_GROUP_F29_F36', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x29);
		});

		it('should have correct structure for FUNCTION_GROUP_F37_F44', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x2a);
		});

		it('should have correct structure for FUNCTION_GROUP_F45_F52', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x2b);
		});

		it('should have correct structure for FUNCTION_GROUP_F53_F60', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x50);
		});

		it('should have correct structure for FUNCTION_GROUP_F61_F68', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x51);
		});
	});

	describe('Response/Event Commands', () => {
		it('should have correct structure for STATUS_CHANGED', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_STATUS_CHANGED;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x62);
			expect(cmd.xBusCmd).toBe(0x22);
		});

		it('should have correct structure for GET_VERSION_ANSWER', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_VERSION_ANSWER;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x63);
			expect(cmd.xBusCmd).toBe(0x21);
		});

		it('should have correct structure for CV_RESULT', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_RESULT;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x64);
			expect(cmd.xBusCmd).toBe(0x14);
		});

		it('should have correct structure for LOCO_INFO response', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_LOCO_INFO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xef);
		});

		it('should have correct structure for GET_FIRMWARE_VERSION', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_FIRMWARE_VERSION;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xf1);
			expect(cmd.xBusCmd).toBe(0x0a);
		});

		it('should have correct structure for GET_FIRMWARE_VERSION_ANSWER', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_GET_FIRMWARE_VERSION_ANSWER;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xf2);
			expect(cmd.xBusCmd).toBe(0x0a);
		});
	});

	describe('Emergency Stop Commands', () => {
		it('should have correct structure for SET_STOP', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_STOP;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x80);
		});

		it('should have correct structure for BC_STOPPED', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_BC_STOPPED;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x81);
		});
	});

	describe('Binary State and Advanced Commands', () => {
		it('should have correct structure for SET_LOCO_BINARY_STATE', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_BINARY_STATE;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe5);
			expect(cmd.xBusCmd).toBe(0x5f);
		});

		it('should have correct structure for TURNOUT_INFO response', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_TURNOUT_INFO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x43);
		});

		it('should have correct structure for EXT_ACCESSORY_INFO response', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_EXT_ACCESSORY_INFO;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x44);
		});

		it('should have correct structure for SET_TURNOUT', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_TURNOUT;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x53);
		});
	});

	describe('Error Response Commands', () => {
		it('should have correct structure for CV_NACK_SC', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_NACK_SC;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x12);
		});

		it('should have correct structure for CV_NACK', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_CV_NACK;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x13);
		});

		it('should have correct structure for UNKNOWN_COMMAND', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_UNKNOWN_COMMAND;

			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x61);
			expect(cmd.xBusCmd).toBe(0x82);
		});
	});

	describe('Command Keys', () => {
		it('should have all expected command keys', () => {
			const keys = Object.keys(LAN_X_COMMANDS);

			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION');
			expect(keys).toContain('LAN_X_SET_LOCO_DRIVE_14');
			expect(keys).toContain('LAN_X_SET_LOCO_DRIVE_28');
			expect(keys).toContain('LAN_X_SET_LOCO_DRIVE_128');
			expect(keys).toContain('LAN_X_GET_LOCO_INFO');
			expect(keys).toContain('LAN_X_SET_LOCO_E_STOP');
			expect(keys).toContain('LAN_X_PURGE_LOCO');
			expect(keys).toContain('LAN_X_SET_TRACK_POWER_OFF');
			expect(keys).toContain('LAN_X_SET_TRACK_POWER_ON');
			expect(keys).toContain('LAN_X_GET_VERSION');
			expect(keys).toContain('LAN_X_GET_STATUS');
			expect(keys).toContain('LAN_X_DCC_READ_REGISTER');
			expect(keys).toContain('LAN_X_DCC_WRITE_REGISTER');
			expect(keys).toContain('LAN_X_MM_WRITE_BYTE');
			expect(keys).toContain('LAN_X_GET_TURNOUT_INFO');
			expect(keys).toContain('LAN_X_GET_EXT_ACCESSORY_INFO');
			expect(keys).toContain('LAN_X_SET_EXT_ACCESSORY');
			expect(keys).toContain('LAN_X_BC_TRACK_POWER_OFF');
			expect(keys).toContain('LAN_X_BC_TRACK_POWER_ON');
			expect(keys).toContain('LAN_X_BC_PROGRAMMING_MODE');
			expect(keys).toContain('LAN_X_BC_TRACK_SHORT_CIRCUIT');
			expect(keys).toContain('LAN_X_CV_READ');
			expect(keys).toContain('LAN_X_CV_WRITE');
			expect(keys).toContain('LAN_X_CV_POM_WRITE_BYTE');
			expect(keys).toContain('LAN_X_CV_POM_WRITE_BIT');
			expect(keys).toContain('LAN_X_CV_POM_READ_BYTE');
			expect(keys).toContain('LAN_X_CV_POM_ACCESSORY_WRITE_BYTE');
			expect(keys).toContain('LAN_X_CV_POM_ACCESSORY_WRITE_BIT');
			expect(keys).toContain('LAN_X_CV_POM_ACCESSORY_READ_BYTE');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60');
			expect(keys).toContain('LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68');
			expect(keys).toContain('LAN_X_STATUS_CHANGED');
			expect(keys).toContain('LAN_X_GET_VERSION_ANSWER');
			expect(keys).toContain('LAN_X_CV_RESULT');
			expect(keys).toContain('LAN_X_LOCO_INFO');
			expect(keys).toContain('LAN_X_GET_FIRMWARE_VERSION');
			expect(keys).toContain('LAN_X_GET_FIRMWARE_VERSION_ANSWER');
			expect(keys).toContain('LAN_X_SET_STOP');
			expect(keys).toContain('LAN_X_BC_STOPPED');
			expect(keys).toContain('LAN_X_SET_LOCO_BINARY_STATE');
			expect(keys).toContain('LAN_X_TURNOUT_INFO');
			expect(keys).toContain('LAN_X_EXT_ACCESSORY_INFO');
			expect(keys).toContain('LAN_X_SET_TURNOUT');
			expect(keys).toContain('LAN_X_CV_NACK_SC');
			expect(keys).toContain('LAN_X_CV_NACK');
			expect(keys).toContain('LAN_X_UNKNOWN_COMMAND');
		});
	});

	describe('Type Safety', () => {
		it('all commands should have lanHeader equal to LAN_X', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd) => {
				expect(cmd.lanHeader).toBe(0x0040);
			});
		});

		it('all commands should be compile-time readonly (as const)', () => {
			// This test verifies that the type system treats these as readonly
			// TypeScript will prevent modifications at compile time via 'as const'
			// Attempting to modify would cause a compile error:
			// const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;
			// cmd.lanHeader = 0x0000; // <- Error: Cannot assign to 'lanHeader' because it is a read-only property

			// We can verify that the object structure is as expected
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;
			expect(typeof cmd.lanHeader).toBe('number');
			expect(typeof cmd.xBusHeader).toBe('number');
		});
	});

	describe('Hex Format Validation', () => {
		it('should match documented hex values for SET_LOCO_FUNCTION', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;
			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0xf8);

			// Also verify as hex strings
			expect(cmd.lanHeader.toString(16).padStart(4, '0')).toBe('0040');
			expect(cmd.xBusHeader.toString(16).padStart(2, '0')).toBe('e4');
			expect(cmd.xBusCmd.toString(16).padStart(2, '0')).toBe('f8');
		});

		it('should match documented hex values for SET_LOCO_DRIVE_128', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128;
			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0xe4);
			expect(cmd.xBusCmd).toBe(0x13);

			// Also verify as hex strings
			expect(cmd.lanHeader.toString(16).padStart(4, '0')).toBe('0040');
			expect(cmd.xBusHeader.toString(16).padStart(2, '0')).toBe('e4');
			expect(cmd.xBusCmd.toString(16).padStart(2, '0')).toBe('13');
		});

		it('should match documented hex values for SET_TRACK_POWER_OFF', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x21);
			expect(cmd.xBusCmd).toBe(0x80);

			// Also verify as hex strings
			expect(cmd.lanHeader.toString(16).padStart(4, '0')).toBe('0040');
			expect(cmd.xBusHeader.toString(16).padStart(2, '0')).toBe('21');
			expect(cmd.xBusCmd.toString(16).padStart(2, '0')).toBe('80');
		});

		it('should match documented hex values for SET_TRACK_POWER_ON', () => {
			const cmd = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
			expect(cmd.lanHeader).toBe(0x0040);
			expect(cmd.xBusHeader).toBe(0x21);
			expect(cmd.xBusCmd).toBe(0x81);

			// Also verify as hex strings
			expect(cmd.lanHeader.toString(16).padStart(4, '0')).toBe('0040');
			expect(cmd.xBusHeader.toString(16).padStart(2, '0')).toBe('21');
			expect(cmd.xBusCmd.toString(16).padStart(2, '0')).toBe('81');
		});
	});

	describe('Command Uniqueness', () => {
		it('should have unique command keys', () => {
			const keys = Object.keys(LAN_X_COMMANDS);
			const uniqueKeys = new Set(keys);

			expect(keys.length).toBe(uniqueKeys.size);
		});

		it('should not have duplicate xBusHeader and xBusCmd combinations', () => {
			const commands = Object.values(LAN_X_COMMANDS);
			const combinations = new Set<string>();

			commands.forEach((cmd) => {
				if (![0x43, 0x44].includes(cmd.xBusHeader)) {
					const xBusCmd = 'xBusCmd' in cmd ? cmd.xBusCmd : undefined;
					const option = 'option' in cmd ? `:option=${cmd.option}` : '';
					const key = `${cmd.xBusHeader}:${xBusCmd ?? 'undefined'}${option ? ':' + option : ''}`;
					expect(combinations.has(key)).toBe(false);
					combinations.add(key);
				}
			});
		});
	});

	describe('Optional Properties', () => {
		it('should have xBusCmd property only on specific commands', () => {
			const commandsWithXBusCmd = [
				LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION,
				LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_14,
				LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_28,
				LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128,
				LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO,
				LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF
			];

			const commandsWithoutXBusCmd = [
				LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO,
				LAN_X_COMMANDS.LAN_X_TURNOUT_INFO,
				LAN_X_COMMANDS.LAN_X_GET_EXT_ACCESSORY_INFO,
				LAN_X_COMMANDS.LAN_X_EXT_ACCESSORY_INFO,
				LAN_X_COMMANDS.LAN_X_SET_TURNOUT,
				LAN_X_COMMANDS.LAN_X_SET_EXT_ACCESSORY,
				LAN_X_COMMANDS.LAN_X_SET_STOP,
				LAN_X_COMMANDS.LAN_X_BC_STOPPED,
				LAN_X_COMMANDS.LAN_X_LOCO_INFO
			];

			commandsWithXBusCmd.forEach((cmd) => {
				expect('xBusCmd' in cmd).toBe(true);
			});

			commandsWithoutXBusCmd.forEach((cmd) => {
				expect('xBusCmd' in cmd).toBe(false);
			});
		});

		it('should have option property only for POM commands', () => {
			const pomCommands = [
				LAN_X_COMMANDS.LAN_X_CV_POM_WRITE_BYTE,
				LAN_X_COMMANDS.LAN_X_CV_POM_WRITE_BIT,
				LAN_X_COMMANDS.LAN_X_CV_POM_READ_BYTE,
				LAN_X_COMMANDS.LAN_X_CV_POM_ACCESSORY_WRITE_BYTE,
				LAN_X_COMMANDS.LAN_X_CV_POM_ACCESSORY_WRITE_BIT,
				LAN_X_COMMANDS.LAN_X_CV_POM_ACCESSORY_READ_BYTE
			];

			const nonPomCommands = [
				LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION,
				LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO,
				LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF
			];

			pomCommands.forEach((cmd) => {
				expect('option' in cmd).toBe(true);
				expect(typeof cmd.option).toBe('number');
			});

			nonPomCommands.forEach((cmd) => {
				expect('option' in cmd).toBe(false);
			});
		});
	});

	describe('Command Count', () => {
		it('should have all expected commands present', () => {
			const keys = Object.keys(LAN_X_COMMANDS);
			expect(keys.length).toBeGreaterThan(50);
		});
	});

	describe('Command Consistency', () => {
		it('all commands should have lanHeader as 0x0040', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd) => {
				expect(cmd.lanHeader).toBe(0x0040);
			});
		});

		it('all commands should have valid xBusHeader values', () => {
			const commands = Object.values(LAN_X_COMMANDS);
			const validHeaders = new Set([
				0x21, 0x22, 0x23, 0x24, 0x43, 0x44, 0x53, 0x54, 0x61, 0x62, 0x63, 0x64, 0x80, 0x81, 0x92, 0xe3, 0xe4, 0xe5, 0xe6, 0xef,
				0xf1, 0xf2
			]);

			commands.forEach((cmd) => {
				expect(validHeaders.has(cmd.xBusHeader)).toBe(true);
			});
		});
	});

	describe('Speed Step Commands Validity', () => {
		it('speed step commands should have sequential xBusCmd values', () => {
			const cmd14 = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_14;
			const cmd28 = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_28;
			const cmd128 = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128;

			expect(cmd14.xBusCmd).toBe(0x10);
			expect(cmd28.xBusCmd).toBe(0x12);
			expect(cmd128.xBusCmd).toBe(0x13);

			expect(cmd28.xBusCmd).toBeGreaterThan(cmd14.xBusCmd);
			expect(cmd128.xBusCmd).toBeGreaterThan(cmd28.xBusCmd);
		});
	});

	describe('Command Type Conformance', () => {
		it('should satisfy LanXCommand interface', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd) => {
				expect('lanHeader' in cmd).toBe(true);
				expect('xBusHeader' in cmd).toBe(true);
			});
		});
	});
});
