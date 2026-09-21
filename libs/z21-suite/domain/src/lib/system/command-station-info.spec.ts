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

	function makeXBusVersion(overrides: Partial<XBusVersion> = {}): XBusVersion {
		return {
			xBusVersion: 3,
			xBusVersionString: '3.0',
			cmdsId: 0x12,
			...overrides
		};
	}

	function makeFirmwareVersion(overrides: Partial<FirmwareVersion> = {}): FirmwareVersion {
		return {
			major: 1,
			minor: 43,
			...overrides
		};
	}

	describe('initial state', () => {
		it('has no command station information initially', () => {
			expect(info.getXBusVersion()).toBeUndefined();
			expect(info.getFirmwareVersion()).toBeUndefined();
			expect(info.getHardwareType()).toBeUndefined();
			expect(info.getCode()).toBeUndefined();

			expect(info.hasXBusVersion()).toBe(false);
			expect(info.hasFirmwareVersion()).toBe(false);
			expect(info.hasHardwareType()).toBe(false);
			expect(info.hasCode()).toBe(false);
		});
	});

	describe('X-Bus version', () => {
		it('stores X-Bus version information', () => {
			const version = makeXBusVersion();

			info.setXBusVersion(version);

			expect(info.hasXBusVersion()).toBe(true);
			expect(info.getXBusVersion()).toEqual(version);
		});

		it('replaces previously stored X-Bus version information', () => {
			info.setXBusVersion(makeXBusVersion());

			const updatedVersion = makeXBusVersion({
				xBusVersion: 3.6,
				xBusVersionString: '3.6',
				cmdsId: 0x13
			});

			info.setXBusVersion(updatedVersion);

			expect(info.getXBusVersion()).toEqual(updatedVersion);
		});
	});

	describe('firmware version', () => {
		it('stores firmware version information', () => {
			const firmware = makeFirmwareVersion();

			info.setFirmwareVersion(firmware);

			expect(info.hasFirmwareVersion()).toBe(true);
			expect(info.getFirmwareVersion()).toEqual(firmware);
		});

		it('replaces previously stored firmware version information', () => {
			info.setFirmwareVersion(makeFirmwareVersion());

			const updatedFirmware = makeFirmwareVersion({
				major: 2,
				minor: 10
			});

			info.setFirmwareVersion(updatedFirmware);

			expect(info.getFirmwareVersion()).toEqual(updatedFirmware);
		});
	});

	describe('hardware type', () => {
		it('stores a known hardware type', () => {
			info.setHardwareType('z21_START');

			expect(info.hasHardwareType()).toBe(true);
			expect(info.getHardwareType()).toBe('z21_START');
		});

		it('treats UNKNOWN as available hardware information', () => {
			info.setHardwareType('UNKNOWN');

			expect(info.hasHardwareType()).toBe(true);
			expect(info.getHardwareType()).toBe('UNKNOWN');
		});

		it('replaces previously stored hardware information', () => {
			info.setHardwareType('Z21_OLD');
			info.setHardwareType('Z21_NEW');

			expect(info.getHardwareType()).toBe('Z21_NEW');
		});
	});

	describe('command station code', () => {
		it('stores the command station code', () => {
			info.setCode(42);

			expect(info.hasCode()).toBe(true);
			expect(info.getCode()).toBe(42);
		});

		it('treats zero as an available command station code', () => {
			info.setCode(0);

			expect(info.hasCode()).toBe(true);
			expect(info.getCode()).toBe(0);
		});

		it('replaces a previously stored command station code', () => {
			info.setCode(10);
			info.setCode(20);

			expect(info.getCode()).toBe(20);
		});
	});

	describe('independent information', () => {
		it('stores all information categories independently', () => {
			const xBusVersion = makeXBusVersion();
			const firmwareVersion = makeFirmwareVersion();

			info.setXBusVersion(xBusVersion);
			info.setFirmwareVersion(firmwareVersion);
			info.setHardwareType('Z21_XL');
			info.setCode(42);

			expect(info.getXBusVersion()).toEqual(xBusVersion);
			expect(info.getFirmwareVersion()).toEqual(firmwareVersion);
			expect(info.getHardwareType()).toBe('Z21_XL');
			expect(info.getCode()).toBe(42);

			expect(info.hasXBusVersion()).toBe(true);
			expect(info.hasFirmwareVersion()).toBe(true);
			expect(info.hasHardwareType()).toBe(true);
			expect(info.hasCode()).toBe(true);
		});
	});
});
