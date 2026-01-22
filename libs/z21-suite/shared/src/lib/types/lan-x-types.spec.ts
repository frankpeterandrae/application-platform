/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS } from './lan-x-types';

describe('LAN_X_COMMANDS Map', () => {
	// Helper function to test command structure (similar to helper functions in bootstrap.spec.ts)
	function expectCommandStructure(
		commandKey: keyof typeof LAN_X_COMMANDS,
		expected: { xHeader: number; xBusCmd?: number; option?: number }
	): void {
		const cmd = LAN_X_COMMANDS[commandKey] as any; // Type assertion needed for optional properties
		expect(cmd.xHeader).toBe(expected.xHeader);
		if (expected.xBusCmd !== undefined) {
			expect(cmd.xBusCmd).toBe(expected.xBusCmd);
		}
		if (expected.option !== undefined) {
			expect(cmd.option).toBe(expected.option);
		}
	}

	describe('Locomotive Control Commands', () => {
		it('should have correct structure for SET_LOCO_FUNCTION (0x0040 0xE4 0xF8)', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION', { xHeader: 0xe4, xBusCmd: 0xf8 });
		});

		it('should have correct structure for SET_LOCO_DRIVE_14 (0x0040 0xE4 0x10)', () => {
			expectCommandStructure('LAN_X_SET_LOCO_DRIVE_14', { xHeader: 0xe4, xBusCmd: 0x10 });
		});

		it('should have correct structure for SET_LOCO_DRIVE_28 (0x0040 0xE4 0x12)', () => {
			expectCommandStructure('LAN_X_SET_LOCO_DRIVE_28', { xHeader: 0xe4, xBusCmd: 0x12 });
		});

		it('should have correct structure for SET_LOCO_DRIVE_128 (0x0040 0xE4 0x13)', () => {
			expectCommandStructure('LAN_X_SET_LOCO_DRIVE_128', { xHeader: 0xe4, xBusCmd: 0x13 });
		});

		it('should have correct structure for LOCO_INFO (0x0040 0xE3 0xF0)', () => {
			expectCommandStructure('LAN_X_GET_LOCO_INFO', { xHeader: 0xe3, xBusCmd: 0xf0 });
		});

		it('should have correct structure for LOCO_E_STOP', () => {
			expectCommandStructure('LAN_X_SET_LOCO_E_STOP', { xHeader: 0x92 });
		});

		it('should have correct structure for PURGE_LOCO', () => {
			expectCommandStructure('LAN_X_PURGE_LOCO', { xHeader: 0xe3, xBusCmd: 0x44 });
		});
	});

	describe('Track Power / Status Commands', () => {
		it('should have correct structure for SET_TRACK_POWER_OFF (0x0040 0x21 0x80)', () => {
			expectCommandStructure('LAN_X_SET_TRACK_POWER_OFF', { xHeader: 0x21, xBusCmd: 0x80 });
		});

		it('should have correct structure for SET_TRACK_POWER_ON (0x0040 0x21 0x81)', () => {
			expectCommandStructure('LAN_X_SET_TRACK_POWER_ON', { xHeader: 0x21, xBusCmd: 0x81 });
		});

		it('should have correct structure for GET_VERSION (0x0040 0x21 0x21)', () => {
			expectCommandStructure('LAN_X_GET_VERSION', { xHeader: 0x21, xBusCmd: 0x21 });
		});

		it('should have correct structure for GET_STATUS (0x0040 0x21 0x24)', () => {
			expectCommandStructure('LAN_X_GET_STATUS', { xHeader: 0x21, xBusCmd: 0x24 });
		});
	});

	describe('Programming (CV) Commands', () => {
		it('should have correct structure for DCC_READ_CV (0x0040 0x22 0x11)', () => {
			expectCommandStructure('LAN_X_DCC_READ_REGISTER', { xHeader: 0x22, xBusCmd: 0x11 });
		});

		it('should have correct structure for DCC_WRITE_CV (0x0040 0x23 0x12)', () => {
			expectCommandStructure('LAN_X_DCC_WRITE_REGISTER', { xHeader: 0x23, xBusCmd: 0x12 });
		});

		it('should have correct structure for MM_WRITE_BYTE (0x0040 0x24 0xFF)', () => {
			expectCommandStructure('LAN_X_MM_WRITE_BYTE', { xHeader: 0x24, xBusCmd: 0xff });
		});
	});

	describe('Turnout / Accessory Commands', () => {
		it('should have correct structure for GET_TURNOUT_INFO (0x0040 0x43)', () => {
			expectCommandStructure('LAN_X_GET_TURNOUT_INFO', { xHeader: 0x43 });
		});

		it('should have correct structure for GET_EXT_ACCESSORY_INFO (0x0040 0x44)', () => {
			expectCommandStructure('LAN_X_GET_EXT_ACCESSORY_INFO', { xHeader: 0x44 });
		});

		it('should have correct structure for SET_EXT_ACCESSORY (0x0040 0x54)', () => {
			expectCommandStructure('LAN_X_SET_EXT_ACCESSORY', { xHeader: 0x54 });
		});
	});

	describe('Broadcast Commands', () => {
		it('should have correct structure for BC_TRACK_POWER_OFF', () => {
			expectCommandStructure('LAN_X_BC_TRACK_POWER_OFF', { xHeader: 0x61, xBusCmd: 0x00 });
		});

		it('should have correct structure for BC_TRACK_POWER_ON', () => {
			expectCommandStructure('LAN_X_BC_TRACK_POWER_ON', { xHeader: 0x61, xBusCmd: 0x01 });
		});

		it('should have correct structure for BC_PROGRAMMING_MODE', () => {
			expectCommandStructure('LAN_X_BC_PROGRAMMING_MODE', { xHeader: 0x61, xBusCmd: 0x02 });
		});

		it('should have correct structure for BC_TRACK_SHORT_CIRCUIT', () => {
			expectCommandStructure('LAN_X_BC_TRACK_SHORT_CIRCUIT', { xHeader: 0x61, xBusCmd: 0x08 });
		});

		it('should have correct structure for BC_STOPPED', () => {
			expectCommandStructure('LAN_X_BC_STOPPED', { xHeader: 0x81 });
		});
	});

	describe('CV/POM Commands', () => {
		it('should have correct structure for CV_READ', () => {
			expectCommandStructure('LAN_X_CV_READ', { xHeader: 0x23, xBusCmd: 0x11 });
		});

		it('should have correct structure for CV_WRITE', () => {
			expectCommandStructure('LAN_X_CV_WRITE', { xHeader: 0x24, xBusCmd: 0x12 });
		});

		it('should have POM_WRITE_BYTE with option set', () => {
			expectCommandStructure('LAN_X_CV_POM_WRITE_BYTE', { xHeader: 0xe6, xBusCmd: 0x30, option: 0xec });
		});

		it('should have POM_WRITE_BIT with option set', () => {
			expectCommandStructure('LAN_X_CV_POM_WRITE_BIT', { xHeader: 0xe6, xBusCmd: 0x30, option: 0xe8 });
		});

		it('should have POM_READ_BYTE with option set', () => {
			expectCommandStructure('LAN_X_CV_POM_READ_BYTE', { xHeader: 0xe6, xBusCmd: 0x30, option: 0xe4 });
		});

		it('should have POM_ACCESSORY_WRITE_BYTE with option set', () => {
			expectCommandStructure('LAN_X_CV_POM_ACCESSORY_WRITE_BYTE', {
				xHeader: 0xe6,
				xBusCmd: 0x31,
				option: 0xec
			});
		});

		it('should have POM_ACCESSORY_WRITE_BIT with option set', () => {
			expectCommandStructure('LAN_X_CV_POM_ACCESSORY_WRITE_BIT', { xHeader: 0xe6, xBusCmd: 0x31, option: 0xe8 });
		});

		it('should have POM_ACCESSORY_READ_BYTE with option set', () => {
			expectCommandStructure('LAN_X_CV_POM_ACCESSORY_READ_BYTE', { xHeader: 0xe6, xBusCmd: 0x31, option: 0xe4 });
		});
	});

	describe('Locomotive Function Group Commands', () => {
		it('should have correct structure for FUNCTION_GROUP_F0_F4', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F0_F4', { xHeader: 0xe4, xBusCmd: 0x20 });
		});

		it('should have correct structure for FUNCTION_GROUP_F5_F8', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F5_F8', { xHeader: 0xe4, xBusCmd: 0x21 });
		});

		it('should have correct structure for FUNCTION_GROUP_F9_F12', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F9_F12', { xHeader: 0xe4, xBusCmd: 0x22 });
		});

		it('should have correct structure for FUNCTION_GROUP_F13_F20', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F13_F20', { xHeader: 0xe4, xBusCmd: 0x23 });
		});

		it('should have correct structure for FUNCTION_GROUP_F21_F28', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F21_F28', { xHeader: 0xe4, xBusCmd: 0x28 });
		});

		it('should have correct structure for FUNCTION_GROUP_F29_F36', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F29_F36', { xHeader: 0xe4, xBusCmd: 0x29 });
		});

		it('should have correct structure for FUNCTION_GROUP_F37_F44', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F37_F44', { xHeader: 0xe4, xBusCmd: 0x2a });
		});

		it('should have correct structure for FUNCTION_GROUP_F45_F52', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F45_F52', { xHeader: 0xe4, xBusCmd: 0x2b });
		});

		it('should have correct structure for FUNCTION_GROUP_F53_F60', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F53_F60', { xHeader: 0xe4, xBusCmd: 0x50 });
		});

		it('should have correct structure for FUNCTION_GROUP_F61_F68', () => {
			expectCommandStructure('LAN_X_SET_LOCO_FUNCTION_GROUP_F61_F68', { xHeader: 0xe4, xBusCmd: 0x51 });
		});
	});

	describe('Turnout Commands', () => {
		it('should have correct structure for SET_TURNOUT', () => {
			expectCommandStructure('LAN_X_SET_TURNOUT', { xHeader: 0x53 });
		});
	});

	describe('Feedback Commands', () => {
		it('should have correct structure for GET_FIRMWARE_VERSION', () => {
			expectCommandStructure('LAN_X_GET_FIRMWARE_VERSION', { xHeader: 0xf1, xBusCmd: 0x0a });
		});
	});

	describe('All Commands', () => {
		it('should have mostly unique command combinations', () => {
			const commands = Object.entries(LAN_X_COMMANDS);
			const seen = new Map<string, string[]>();

			commands.forEach(([name, cmd]: [string, any]) => {
				const key = `${cmd.xHeader}-${cmd.xBusCmd ?? 'none'}-${cmd.option ?? 'none'}`;
				if (!seen.has(key)) {
					seen.set(key, []);
				}
				seen.get(key)?.push(name);
			});

			// Allow some known duplicates (like answer/event pairs)
			const duplicates = Array.from(seen.entries()).filter(([_, names]) => names.length > 1);

			// This is informational - some duplicates are expected for response/event pairs
			if (duplicates.length > 0) {
				console.log(
					'Duplicate command combinations found:',
					duplicates.map(([key, names]) => ({ key, names }))
				);
			}

			// Most commands should be unique
			expect(seen.size).toBeGreaterThan(40);
		});

		it('should have all required properties', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd) => {
				expect(cmd).toHaveProperty('xHeader');
				expect(typeof cmd.xHeader).toBe('number');
			});
		});

		it('should have valid xHeader values (0-255)', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd) => {
				expect(cmd.xHeader).toBeGreaterThanOrEqual(0);
				expect(cmd.xHeader).toBeLessThanOrEqual(255);
			});
		});

		it('should have valid xBusCmd values when present (0-255)', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd: any) => {
				if (cmd.xBusCmd !== undefined) {
					expect(cmd.xBusCmd).toBeGreaterThanOrEqual(0);
					expect(cmd.xBusCmd).toBeLessThanOrEqual(255);
				}
			});
		});

		it('should have valid option values when present (0-255)', () => {
			const commands = Object.values(LAN_X_COMMANDS);

			commands.forEach((cmd: any) => {
				if (cmd.option !== undefined) {
					expect(cmd.option).toBeGreaterThanOrEqual(0);
					expect(cmd.option).toBeLessThanOrEqual(255);
				}
			});
		});
	});
});
