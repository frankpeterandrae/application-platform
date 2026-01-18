/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommandStationInfo, type FirmwareVersion, type XbusVersion } from './command-station-info';

describe('CommandStationInfo', () => {
	let info: CommandStationInfo;

	beforeEach(() => {
		info = new CommandStationInfo();
	});

	describe('xBus Version Management', () => {
		it('returns undefined for xBusVersion initially', () => {
			const version = info.getXBusVersion();
			expect(version).toBeUndefined();
		});

		it('stores and retrieves xBusVersion information', () => {
			const versionData: XbusVersion = { xbusVersion: 0x30, xBusVersionString: 'V3.0', cmdsId: 0x12 };

			info.setXBusVersion(versionData);
			const result = info.getXBusVersion();

			expect(result).toEqual(versionData);
		});

		it('updates xBusVersion when called multiple times', () => {
			const version1: XbusVersion = { xbusVersion: 0x30, xBusVersionString: 'V3.0', cmdsId: 0x10 };
			const version2: XbusVersion = { xbusVersion: 0x36, xBusVersionString: 'V3.6', cmdsId: 0x20 };

			info.setXBusVersion(version1);
			expect(info.getXBusVersion()).toEqual(version1);

			info.setXBusVersion(version2);
			expect(info.getXBusVersion()).toEqual(version2);
		});

		it('indicates xBusVersion is available after setting', () => {
			expect(info.hasXBusVersion()).toBe(false);

			const versionData: XbusVersion = { xbusVersion: 0x40, xBusVersionString: 'V4.0', cmdsId: 0x15 };
			info.setXBusVersion(versionData);

			expect(info.hasXBusVersion()).toBe(true);
		});

		it('indicates xBusVersion is not available when undefined', () => {
			expect(info.hasXBusVersion()).toBe(false);
		});

		it('stores xBusVersion with only xbusVersion field', () => {
			const versionData: XbusVersion = { xbusVersion: 0x30 };

			info.setXBusVersion(versionData);
			const result = info.getXBusVersion();

			expect(result?.xbusVersion).toBe(0x30);
			expect(result?.xBusVersionString).toBeUndefined();
			expect(result?.cmdsId).toBeUndefined();
		});

		it('stores xBusVersion with only xBusVersionString field', () => {
			const versionData: XbusVersion = { xBusVersionString: 'V3.6' };

			info.setXBusVersion(versionData);
			const result = info.getXBusVersion();

			expect(result?.xBusVersionString).toBe('V3.6');
			expect(result?.xbusVersion).toBeUndefined();
			expect(result?.cmdsId).toBeUndefined();
		});

		it('stores xBusVersion with only cmdsId field', () => {
			const versionData: XbusVersion = { cmdsId: 0x42 };

			info.setXBusVersion(versionData);
			const result = info.getXBusVersion();

			expect(result?.cmdsId).toBe(0x42);
			expect(result?.xbusVersion).toBeUndefined();
			expect(result?.xBusVersionString).toBeUndefined();
		});

		it('stores complete xBusVersion with all fields', () => {
			const versionData: XbusVersion = {
				xbusVersion: 0x30,
				xBusVersionString: 'V3.0',
				cmdsId: 0x12
			};

			info.setXBusVersion(versionData);
			const result = info.getXBusVersion();

			expect(result).toEqual(versionData);
		});

		it('returns the exact same object reference from getXBusVersion', () => {
			const versionData: XbusVersion = { xbusVersion: 0x30, cmdsId: 0x10 };

			info.setXBusVersion(versionData);
			const result1 = info.getXBusVersion();
			const result2 = info.getXBusVersion();

			expect(result1).toBe(result2);
		});

		it('allows overwriting xBusVersion with empty object', () => {
			const versionData: XbusVersion = { xbusVersion: 0x30, cmdsId: 0x10 };
			info.setXBusVersion(versionData);
			expect(info.hasXBusVersion()).toBe(true);

			info.setXBusVersion({});
			expect(info.hasXBusVersion()).toBe(true);
			expect(info.getXBusVersion()).toEqual({});
		});
	});

	describe('Firmware Version Management', () => {
		it('returns undefined for firmwareVersion initially', () => {
			const version = info.getFirmwareVersion();
			expect(version).toBeUndefined();
		});

		it('stores and retrieves firmware version information', () => {
			const versionData: FirmwareVersion = { major: 0x12, minor: 0x34 };

			info.setFirmwareVersion(versionData);
			const result = info.getFirmwareVersion();

			expect(result).toEqual(versionData);
		});

		it('updates firmware version when called multiple times', () => {
			const version1: FirmwareVersion = { major: 0x10, minor: 0x01 };
			const version2: FirmwareVersion = { major: 0x25, minor: 0x42 };

			info.setFirmwareVersion(version1);
			expect(info.getFirmwareVersion()).toEqual(version1);

			info.setFirmwareVersion(version2);
			expect(info.getFirmwareVersion()).toEqual(version2);
		});

		it('indicates firmware version is available after setting', () => {
			expect(info.hasFirmwareVersion()).toBe(false);

			const versionData: FirmwareVersion = { major: 0x20, minor: 0x15 };
			info.setFirmwareVersion(versionData);

			expect(info.hasFirmwareVersion()).toBe(true);
		});

		it('indicates firmware version is not available when undefined', () => {
			expect(info.hasFirmwareVersion()).toBe(false);
		});

		it('stores firmware version with minimum values', () => {
			const versionData: FirmwareVersion = { major: 0x00, minor: 0x00 };

			info.setFirmwareVersion(versionData);
			const result = info.getFirmwareVersion();

			expect(result?.major).toBe(0x00);
			expect(result?.minor).toBe(0x00);
		});

		it('stores firmware version with maximum values', () => {
			const versionData: FirmwareVersion = { major: 0xff, minor: 0xff };

			info.setFirmwareVersion(versionData);
			const result = info.getFirmwareVersion();

			expect(result?.major).toBe(0xff);
			expect(result?.minor).toBe(0xff);
		});

		it('returns the exact same object reference from getFirmwareVersion', () => {
			const versionData: FirmwareVersion = { major: 0x12, minor: 0x34 };

			info.setFirmwareVersion(versionData);
			const result1 = info.getFirmwareVersion();
			const result2 = info.getFirmwareVersion();

			expect(result1).toBe(result2);
		});
	});

	describe('Independent Version Management', () => {
		it('manages xBusVersion and firmwareVersion independently', () => {
			const xbusData: XbusVersion = { xbusVersion: 0x30, cmdsId: 0x10 };
			const firmwareData: FirmwareVersion = { major: 0x12, minor: 0x34 };

			info.setXBusVersion(xbusData);
			info.setFirmwareVersion(firmwareData);

			expect(info.getXBusVersion()).toEqual(xbusData);
			expect(info.getFirmwareVersion()).toEqual(firmwareData);
		});

		it('clearing xBusVersion does not affect firmwareVersion', () => {
			const xbusData: XbusVersion = { xbusVersion: 0x30 };
			const firmwareData: FirmwareVersion = { major: 0x12, minor: 0x34 };

			info.setXBusVersion(xbusData);
			info.setFirmwareVersion(firmwareData);
			info.setXBusVersion({});

			expect(info.getFirmwareVersion()).toEqual(firmwareData);
		});

		it('clearing firmwareVersion does not affect xBusVersion', () => {
			const xbusData: XbusVersion = { xbusVersion: 0x30 };
			const firmwareData: FirmwareVersion = { major: 0x12, minor: 0x34 };

			info.setXBusVersion(xbusData);
			info.setFirmwareVersion(firmwareData);

			info.setFirmwareVersion({ major: 0, minor: 0 });
			expect(info.getXBusVersion()).toEqual(xbusData);
		});

		it('both versions can be set and retrieved after fresh instance', () => {
			const newInfo = new CommandStationInfo();
			const xbusData: XbusVersion = { xbusVersion: 0x40 };
			const firmwareData: FirmwareVersion = { major: 0x25, minor: 0x99 };

			newInfo.setXBusVersion(xbusData);
			newInfo.setFirmwareVersion(firmwareData);

			expect(newInfo.hasXBusVersion()).toBe(true);
			expect(newInfo.hasFirmwareVersion()).toBe(true);
			expect(newInfo.getXBusVersion()).toEqual(xbusData);
			expect(newInfo.getFirmwareVersion()).toEqual(firmwareData);
		});
	});

	describe('Edge Cases', () => {
		it('handles setting xBusVersion to undefined implicitly by checking state', () => {
			const versionData: XbusVersion = { xbusVersion: 0x30 };
			info.setXBusVersion(versionData);
			expect(info.hasXBusVersion()).toBe(true);

			const emptyVersion: XbusVersion = {};
			info.setXBusVersion(emptyVersion);
			expect(info.hasXBusVersion()).toBe(true);
		});

		it('supports multiple instances with separate state', () => {
			const info1 = new CommandStationInfo();
			const info2 = new CommandStationInfo();

			const version1: XbusVersion = { xbusVersion: 0x30 };
			const version2: XbusVersion = { xbusVersion: 0x40 };

			info1.setXBusVersion(version1);
			info2.setXBusVersion(version2);

			expect(info1.getXBusVersion()).toEqual(version1);
			expect(info2.getXBusVersion()).toEqual(version2);
		});

		it('does not share state between different instances', () => {
			const info1 = new CommandStationInfo();
			const info2 = new CommandStationInfo();

			const version: XbusVersion = { xbusVersion: 0x30 };
			info1.setXBusVersion(version);

			expect(info2.hasXBusVersion()).toBe(false);
			expect(info2.getXBusVersion()).toBeUndefined();
		});

		it('returns falsy value for hasXBusVersion when xBusVersion is set to empty object', () => {
			info.setXBusVersion({});
			expect(info.hasXBusVersion()).toBe(true);
		});

		it('returns falsy value for hasFirmwareVersion when never set', () => {
			expect(info.hasFirmwareVersion()).toBe(false);
		});
	});
});
