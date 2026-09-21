/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HardwareType } from '@application-platform/z21-shared';

export type XBusVersion = {
	xBusVersion: number;
	xBusVersionString: string;
	cmdsId: number;
	raw?: number[];
};

export type FirmwareVersion = {
	major: number;
	minor: number;
	raw?: number[];
};

/**
 * Stores information discovered about the connected Z21 command station.
 */
export class CommandStationInfo {
	private xBusVersion?: XBusVersion;
	private firmwareVersion?: FirmwareVersion;
	private hardwareType?: HardwareType | 'UNKNOWN';
	private code?: number;

	/**
	 * Returns the discovered X-Bus version information.
	 *
	 * @returns The X-Bus version, or undefined if it has not been received yet.
	 */
	public getXBusVersion(): XBusVersion | undefined {
		return this.xBusVersion;
	}

	/**
	 * Stores X-Bus version information reported by the command station.
	 *
	 * @param value - X-Bus version information.
	 */
	public setXBusVersion(value: XBusVersion): void {
		this.xBusVersion = value;
	}

	/**
	 * Indicates whether X-Bus version information has been received.
	 *
	 * @returns True when X-Bus version information is available.
	 */
	public hasXBusVersion(): boolean {
		return this.xBusVersion !== undefined;
	}

	/**
	 * Returns the discovered firmware version.
	 *
	 * @returns The firmware version, or undefined if it has not been received yet.
	 */
	public getFirmwareVersion(): FirmwareVersion | undefined {
		return this.firmwareVersion;
	}

	/**
	 * Stores firmware version information reported by the command station.
	 *
	 * @param value - Firmware version information.
	 */
	public setFirmwareVersion(value: FirmwareVersion): void {
		this.firmwareVersion = value;
	}

	/**
	 * Indicates whether firmware version information has been received.
	 *
	 * @returns True when firmware version information is available.
	 */
	public hasFirmwareVersion(): boolean {
		return this.firmwareVersion !== undefined;
	}

	/**
	 * Returns the discovered command station hardware type.
	 *
	 * @returns The hardware type, or undefined if it has not been received yet.
	 */
	public getHardwareType(): HardwareType | 'UNKNOWN' | undefined {
		return this.hardwareType;
	}

	/**
	 * Stores the hardware type reported by the command station.
	 *
	 * @param hardwareType - Hardware type reported by the command station.
	 */
	public setHardwareType(hardwareType: HardwareType | 'UNKNOWN'): void {
		this.hardwareType = hardwareType;
	}

	/**
	 * Indicates whether hardware information has been received.
	 *
	 * @returns True when a hardware type is available, including UNKNOWN.
	 */
	public hasHardwareType(): boolean {
		return this.hardwareType !== undefined;
	}

	/**
	 * Returns the command station code.
	 *
	 * @returns The code, or undefined if it has not been received yet.
	 */
	public getCode(): number | undefined {
		return this.code;
	}

	/**
	 * Stores the command station code.
	 *
	 * @param code - Command station code.
	 */
	public setCode(code: number): void {
		this.code = code;
	}

	/**
	 * Indicates whether a command station code has been received.
	 *
	 * @returns True when a code is available, including zero.
	 */
	public hasCode(): boolean {
		return this.code !== undefined;
	}
}
