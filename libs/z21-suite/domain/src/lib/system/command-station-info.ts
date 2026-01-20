/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HardwareType } from '@application-platform/z21-shared';

export type XBusVersion = {
	xBusVersion?: number;
	xBusVersionString?: string;
	cmdsId?: number;
	raw?: number[];
};

export type FirmwareVersion = {
	major: number;
	minor: number;
	raw?: number[];
};

/**
 * Command Station Information
 * Holds information about the connected command station
 */
export class CommandStationInfo {
	private xBusVersion?: XBusVersion;
	private firmwareVersion?: FirmwareVersion;
	private hardwareType?: HardwareType | 'UNKNOWN';
	private code?: number;

	/**
	 *  Get Command Station x-Bus Version Information
	 */
	public getXBusVersion(): XBusVersion | undefined {
		return this.xBusVersion;
	}

	/**
	 * Set Command Station x-Bus Version Information
	 * @param value - version information
	 */
	public setXBusVersion(value: XBusVersion): void {
		this.xBusVersion = value;
	}

	/**
	 * Check if version information is available
	 */
	public hasXBusVersion(): boolean {
		return !!this.xBusVersion;
	}

	/**
	 * Get Firmware Version Information
	 */
	public getFirmwareVersion(): FirmwareVersion | undefined {
		return this.firmwareVersion;
	}

	/**
	 * Set Firmware Version Information
	 * @param value - Firmware version information
	 */
	public setFirmwareVersion(value: FirmwareVersion): void {
		this.firmwareVersion = value;
	}

	/**
	 * Check if Firmware Version information is available
	 */
	public hasFirmwareVersion(): boolean {
		return !!this.firmwareVersion;
	}

	/**
	 * Get Hardware Information
	 */
	public getHardwareType(): HardwareType | 'UNKNOWN' | undefined {
		return this.hardwareType;
	}

	/**
	 * Set Hardware Information
	 * @param hardwareType - Hardware type information
	 */
	public setHardwareType(hardwareType: HardwareType | 'UNKNOWN'): void {
		this.hardwareType = hardwareType;
	}

	/**
	 * Check if Hardware Information is available
	 */
	public hasHardwareType(): boolean {
		return !!this.hardwareType;
	}

	/**
	 * Get CS Code
	 */
	public getCode(): number | undefined {
		return this.code;
	}

	/**
	 * Set CS Code
	 * @param code - CS code information
	 */
	public setCode(code: number): void {
		this.code = code;
	}

	/**
	 * Check if CS Code is available
	 */
	public hasCode(): boolean {
		return this.code !== undefined;
	}
}
