/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommandStationInfo, type FirmwareVersion, type XBusVersion } from './command-station-info';

describe('CommandStationInfo', () => {
	let info: CommandStationInfo;

	beforeEach(() => {
		info = new CommandStationInfo();
	});

	// Helper functions to create test data (similar to makeProviders in bootstrap.spec.ts)
	function makeXBusVersion(overrides: Partial<XBusVersion> = {}): XBusVersion {
		return {
			xBusVersion: 0x30,
			xBusVersionString: 'V3.0',
			cmdsId: 0x12,
			...overrides
		};
	}

	function makeFirmwareVersion(overrides: Partial<FirmwareVersion> = {}): FirmwareVersion {
		return {
			major: 0x12,
			minor: 0x34,
			...overrides
		};
	}

	describe('xBus Version Management', () => {
		it('returns undefined for version initially', () => {
			expect(info.getXBusVersion()).toBeUndefined();
		});

		it('stores and retrieves version information', () => {
			const versionData = makeXBusVersion();

			info.setXBusVersion(versionData);

			expect(info.getXBusVersion()).toEqual(versionData);
		});

		it('updates version when called multiple times', () => {
			const version1 = makeXBusVersion({ xBusVersion: 0x30, cmdsId: 0x10 });
			const version2 = makeXBusVersion({ xBusVersion: 0x36, xBusVersionString: 'V3.6', cmdsId: 0x20 });

			info.setXBusVersion(version1);
			expect(info.getXBusVersion()).toEqual(version1);

			info.setXBusVersion(version2);
			expect(info.getXBusVersion()).toEqual(version2);
		});

		it('indicates version is available after setting', () => {
			expect(info.hasXBusVersion()).toBe(false);

			info.setXBusVersion(makeXBusVersion({ xBusVersion: 0x40, cmdsId: 0x15 }));

			expect(info.hasXBusVersion()).toBe(true);
		});

		it('indicates version is not available when undefined', () => {
			expect(info.hasXBusVersion()).toBe(false);
		});

		describe('partial version data', () => {
			it('stores version with only xBusVersion field', () => {
				info.setXBusVersion({ xBusVersion: 0x30 });

				const result = info.getXBusVersion();
				expect(result?.xBusVersion).toBe(0x30);
				expect(result?.xBusVersionString).toBeUndefined();
				expect(result?.cmdsId).toBeUndefined();
			});

			it('stores version with only xBusVersionString field', () => {
				info.setXBusVersion({ xBusVersionString: 'V3.6' });

				const result = info.getXBusVersion();
				expect(result?.xBusVersionString).toBe('V3.6');
				expect(result?.xBusVersion).toBeUndefined();
				expect(result?.cmdsId).toBeUndefined();
			});

			it('stores version with only cmdsId field', () => {
				info.setXBusVersion({ cmdsId: 0x42 });

				const result = info.getXBusVersion();
				expect(result?.cmdsId).toBe(0x42);
				expect(result?.xBusVersion).toBeUndefined();
				expect(result?.xBusVersionString).toBeUndefined();
			});

			it('stores complete version with all fields', () => {
				const versionData = makeXBusVersion();

				info.setXBusVersion(versionData);

				expect(info.getXBusVersion()).toEqual(versionData);
			});
		});

		it('returns the exact same object reference from getXBusVersion', () => {
			const versionData = makeXBusVersion({ xBusVersion: 0x30, cmdsId: 0x10 });

			info.setXBusVersion(versionData);
			const result1 = info.getXBusVersion();
			const result2 = info.getXBusVersion();

			expect(result1).toBe(result2);
		});

		it('allows overwriting version with empty object', () => {
			info.setXBusVersion(makeXBusVersion());
			expect(info.hasXBusVersion()).toBe(true);

			info.setXBusVersion({});
			expect(info.hasXBusVersion()).toBe(true);
			expect(info.getXBusVersion()).toEqual({});
		});

		describe('cmdsId handling', () => {
			it('stores cmdsId value 0x12', () => {
				info.setXBusVersion({ cmdsId: 0x12 });

				expect(info.getXBusVersion()?.cmdsId).toBe(0x12);
			});

			it('stores cmdsId value 0x13', () => {
				info.setXBusVersion({ cmdsId: 0x13 });

				expect(info.getXBusVersion()?.cmdsId).toBe(0x13);
			});

			it('stores cmdsId value 0', () => {
				info.setXBusVersion({ cmdsId: 0 });

				expect(info.getXBusVersion()?.cmdsId).toBe(0);
			});

			it('stores cmdsId value 255', () => {
				info.setXBusVersion({ cmdsId: 0xff });

				expect(info.getXBusVersion()?.cmdsId).toBe(0xff);
			});

			it('updates cmdsId when version is updated', () => {
				info.setXBusVersion({ cmdsId: 0x12 });
				expect(info.getXBusVersion()?.cmdsId).toBe(0x12);

				info.setXBusVersion({ cmdsId: 0x13 });
				expect(info.getXBusVersion()?.cmdsId).toBe(0x13);
			});

			it('preserves cmdsId when updating with different fields', () => {
				info.setXBusVersion({ cmdsId: 0x12 });
				info.setXBusVersion({ xBusVersion: 0x30 });

				expect(info.getXBusVersion()?.cmdsId).toBeUndefined();
				expect(info.getXBusVersion()?.xBusVersion).toBe(0x30);
			});

			it('stores cmdsId alongside xBusVersion', () => {
				info.setXBusVersion({ xBusVersion: 0x30, cmdsId: 0x12 });

				const result = info.getXBusVersion();
				expect(result?.xBusVersion).toBe(0x30);
				expect(result?.cmdsId).toBe(0x12);
			});

			it('stores cmdsId alongside xBusVersionString', () => {
				info.setXBusVersion({ xBusVersionString: 'V3.0', cmdsId: 0x12 });

				const result = info.getXBusVersion();
				expect(result?.xBusVersionString).toBe('V3.0');
				expect(result?.cmdsId).toBe(0x12);
			});

			it('handles cmdsId in complete version object', () => {
				const versionData = makeXBusVersion({ xBusVersion: 0x36, xBusVersionString: 'V3.6', cmdsId: 0x13 });

				info.setXBusVersion(versionData);

				const result = info.getXBusVersion();
				expect(result).toEqual(versionData);
				expect(result?.cmdsId).toBe(0x13);
			});
		});
	});

	describe('Firmware Version Management', () => {
		it('returns undefined for firmwareVersion initially', () => {
			expect(info.getFirmwareVersion()).toBeUndefined();
		});

		it('stores and retrieves firmware version information', () => {
			const versionData = makeFirmwareVersion();

			info.setFirmwareVersion(versionData);

			expect(info.getFirmwareVersion()).toEqual(versionData);
		});

		it('updates firmware version when called multiple times', () => {
			const version1 = makeFirmwareVersion({ major: 0x10, minor: 0x01 });
			const version2 = makeFirmwareVersion({ major: 0x25, minor: 0x42 });

			info.setFirmwareVersion(version1);
			expect(info.getFirmwareVersion()).toEqual(version1);

			info.setFirmwareVersion(version2);
			expect(info.getFirmwareVersion()).toEqual(version2);
		});

		it('indicates firmware version is available after setting', () => {
			expect(info.hasFirmwareVersion()).toBe(false);

			info.setFirmwareVersion(makeFirmwareVersion({ major: 0x20, minor: 0x15 }));

			expect(info.hasFirmwareVersion()).toBe(true);
		});

		it('indicates firmware version is not available when undefined', () => {
			expect(info.hasFirmwareVersion()).toBe(false);
		});

		it('stores firmware version with minimum values', () => {
			info.setFirmwareVersion({ major: 0x00, minor: 0x00 });

			const result = info.getFirmwareVersion();
			expect(result?.major).toBe(0x00);
			expect(result?.minor).toBe(0x00);
		});

		it('stores firmware version with maximum values', () => {
			info.setFirmwareVersion({ major: 0xff, minor: 0xff });

			const result = info.getFirmwareVersion();
			expect(result?.major).toBe(0xff);
			expect(result?.minor).toBe(0xff);
		});

		it('returns the exact same object reference from getFirmwareVersion', () => {
			const versionData = makeFirmwareVersion();

			info.setFirmwareVersion(versionData);
			const result1 = info.getFirmwareVersion();
			const result2 = info.getFirmwareVersion();

			expect(result1).toBe(result2);
		});
	});

	describe('Independent Version Management', () => {
		it('manages version and firmwareVersion independently', () => {
			const xbusData = makeXBusVersion({ xBusVersion: 0x30, cmdsId: 0x10 });
			const firmwareData = makeFirmwareVersion();

			info.setXBusVersion(xbusData);
			info.setFirmwareVersion(firmwareData);

			expect(info.getXBusVersion()).toEqual(xbusData);
			expect(info.getFirmwareVersion()).toEqual(firmwareData);
		});

		it('clearing version does not affect firmwareVersion', () => {
			const firmwareData = makeFirmwareVersion();

			info.setXBusVersion({ xBusVersion: 0x30 });
			info.setFirmwareVersion(firmwareData);
			info.setXBusVersion({});

			expect(info.getFirmwareVersion()).toEqual(firmwareData);
		});

		it('clearing firmwareVersion does not affect version', () => {
			const xbusData = makeXBusVersion({ xBusVersion: 0x30 });

			info.setXBusVersion(xbusData);
			info.setFirmwareVersion(makeFirmwareVersion());

			info.setFirmwareVersion({ major: 0, minor: 0 });
			expect(info.getXBusVersion()).toEqual(xbusData);
		});

		it('both versions can be set and retrieved after fresh instance', () => {
			const newInfo = new CommandStationInfo();
			const xbusData = makeXBusVersion({ xBusVersion: 0x40 });
			const firmwareData = makeFirmwareVersion({ major: 0x25, minor: 0x99 });

			newInfo.setXBusVersion(xbusData);
			newInfo.setFirmwareVersion(firmwareData);

			expect(newInfo.hasXBusVersion()).toBe(true);
			expect(newInfo.hasFirmwareVersion()).toBe(true);
			expect(newInfo.getXBusVersion()).toEqual(xbusData);
			expect(newInfo.getFirmwareVersion()).toEqual(firmwareData);
		});
	});

	describe('Hardware Type Management', () => {
		it('returns undefined for hardware type initially', () => {
			const hwType = info.getHardwareType();
			expect(hwType).toBeUndefined();
		});

		it('stores and retrieves Z21_OLD hardware type', () => {
			info.setHardwareType('Z21_OLD');
			const result = info.getHardwareType();

			expect(result).toBe('Z21_OLD');
		});

		it('stores and retrieves Z21_NEW hardware type', () => {
			info.setHardwareType('Z21_NEW');

			expect(info.getHardwareType()).toBe('Z21_NEW');
		});

		it('stores and retrieves Z21_XL hardware type', () => {
			info.setHardwareType('Z21_XL');

			expect(info.getHardwareType()).toBe('Z21_XL');
		});

		it('stores and retrieves z21_SMALL hardware type', () => {
			info.setHardwareType('z21_SMALL');

			expect(info.getHardwareType()).toBe('z21_SMALL');
		});

		it('stores and retrieves z21_START hardware type', () => {
			info.setHardwareType('z21_START');

			expect(info.getHardwareType()).toBe('z21_START');
		});

		it('stores and retrieves UNKNOWN hardware type', () => {
			info.setHardwareType('UNKNOWN');

			expect(info.getHardwareType()).toBe('UNKNOWN');
		});

		it('updates hardware type when called multiple times', () => {
			info.setHardwareType('Z21_OLD');
			expect(info.getHardwareType()).toBe('Z21_OLD');

			info.setHardwareType('Z21_NEW');
			expect(info.getHardwareType()).toBe('Z21_NEW');
		});

		it('indicates hardware type is available after setting', () => {
			expect(info.hasHardwareType()).toBe(false);

			info.setHardwareType('Z21_XL');

			expect(info.hasHardwareType()).toBe(true);
		});

		it('indicates hardware type is not available when undefined', () => {
			expect(info.hasHardwareType()).toBe(false);
		});

		it('indicates hardware type is available even for UNKNOWN', () => {
			info.setHardwareType('UNKNOWN');

			expect(info.hasHardwareType()).toBe(true);
		});
	});

	describe('Code Management', () => {
		it('returns undefined for code initially', () => {
			const code = info.getCode();
			expect(code).toBeUndefined();
		});

		it('stores and retrieves code value 0', () => {
			info.setCode(0);
			const result = info.getCode();

			expect(result).toBe(0);
		});

		it('stores and retrieves code value 255', () => {
			info.setCode(255);

			expect(info.getCode()).toBe(255);
		});

		it('stores and retrieves arbitrary code value', () => {
			info.setCode(42);

			expect(info.getCode()).toBe(42);
		});

		it('updates code when called multiple times', () => {
			info.setCode(10);
			expect(info.getCode()).toBe(10);

			info.setCode(20);
			expect(info.getCode()).toBe(20);
		});

		it('indicates code is available after setting', () => {
			expect(info.hasCode()).toBe(false);

			info.setCode(100);

			expect(info.hasCode()).toBe(true);
		});

		it('indicates code is not available when undefined', () => {
			expect(info.hasCode()).toBe(false);
		});

		it('indicates code is available even when set to 0', () => {
			info.setCode(0);

			expect(info.hasCode()).toBe(true);
			expect(info.getCode()).toBe(0);
		});
	});

	describe('Complete Information Management', () => {
		it('manages all properties independently', () => {
			const xbusData = makeXBusVersion({ xBusVersion: 0x30, cmdsId: 0x10 });
			const firmwareData = makeFirmwareVersion();

			info.setXBusVersion(xbusData);
			info.setFirmwareVersion(firmwareData);
			info.setHardwareType('Z21_XL');
			info.setCode(42);

			expect(info.getXBusVersion()).toEqual(xbusData);
			expect(info.getFirmwareVersion()).toEqual(firmwareData);
			expect(info.getHardwareType()).toBe('Z21_XL');
			expect(info.getCode()).toBe(42);
		});

		it('indicates all properties are available when all are set', () => {
			info.setXBusVersion({ xBusVersion: 0x30 });
			info.setFirmwareVersion({ major: 1, minor: 20 });
			info.setHardwareType('Z21_NEW');
			info.setCode(10);

			expect(info.hasXBusVersion()).toBe(true);
			expect(info.hasFirmwareVersion()).toBe(true);
			expect(info.hasHardwareType()).toBe(true);
			expect(info.hasCode()).toBe(true);
		});

		it('setting hardware type does not affect other properties', () => {
			info.setXBusVersion({ xBusVersion: 0x30 });
			info.setFirmwareVersion({ major: 1, minor: 20 });
			info.setCode(5);

			info.setHardwareType('Z21_XL');

			expect(info.hasXBusVersion()).toBe(true);
			expect(info.hasFirmwareVersion()).toBe(true);
			expect(info.hasCode()).toBe(true);
		});

		it('setting code does not affect other properties', () => {
			info.setXBusVersion({ xBusVersion: 0x30 });
			info.setFirmwareVersion({ major: 1, minor: 20 });
			info.setHardwareType('Z21_NEW');

			info.setCode(100);

			expect(info.hasXBusVersion()).toBe(true);
			expect(info.hasFirmwareVersion()).toBe(true);
			expect(info.hasHardwareType()).toBe(true);
		});
	});

	describe('Edge Cases', () => {
		it('handles setting version to undefined implicitly by checking state', () => {
			const versionData = makeXBusVersion({ xBusVersion: 0x30 });
			info.setXBusVersion(versionData);
			expect(info.hasXBusVersion()).toBe(true);

			info.setXBusVersion({});
			expect(info.hasXBusVersion()).toBe(true);
		});

		it('supports multiple instances with separate state', () => {
			const info1 = new CommandStationInfo();
			const info2 = new CommandStationInfo();

			const version1 = makeXBusVersion({ xBusVersion: 0x30 });
			const version2 = makeXBusVersion({ xBusVersion: 0x40 });

			info1.setXBusVersion(version1);
			info2.setXBusVersion(version2);

			expect(info1.getXBusVersion()).toEqual(version1);
			expect(info2.getXBusVersion()).toEqual(version2);
		});

		it('does not share state between different instances', () => {
			const info1 = new CommandStationInfo();
			const info2 = new CommandStationInfo();

			const version = makeXBusVersion({ xBusVersion: 0x30 });
			info1.setXBusVersion(version);

			expect(info2.hasXBusVersion()).toBe(false);
			expect(info2.getXBusVersion()).toBeUndefined();
		});

		it('returns falsy value for hasXBusVersion when version is set to empty object', () => {
			info.setXBusVersion({});
			expect(info.hasXBusVersion()).toBe(true);
		});

		it('returns falsy value for hasFirmwareVersion when never set', () => {
			expect(info.hasFirmwareVersion()).toBe(false);
		});

		it('does not share hardware type between instances', () => {
			const info1 = new CommandStationInfo();
			const info2 = new CommandStationInfo();

			info1.setHardwareType('Z21_OLD');

			expect(info2.hasHardwareType()).toBe(false);
			expect(info2.getHardwareType()).toBeUndefined();
		});

		it('does not share code between instances', () => {
			const info1 = new CommandStationInfo();
			const info2 = new CommandStationInfo();

			info1.setCode(42);

			expect(info2.hasCode()).toBe(false);
			expect(info2.getCode()).toBeUndefined();
		});
	});
});
