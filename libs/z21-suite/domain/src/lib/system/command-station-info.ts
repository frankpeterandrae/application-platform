/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type XbusVersion = {
	xbusVersion?: number;
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
	private xBusVersion?: XbusVersion;
	private firmwareVersion?: FirmwareVersion;

	/**
	 *  Get Command Station x-Bus Version Information
	 */
	public getXBusVersion(): XbusVersion | undefined {
		return this.xBusVersion;
	}

	/**
	 * Set Command Station x-Bus Version Information
	 * @param value - xBusVersion information
	 */
	public setXBusVersion(value: XbusVersion): void {
		this.xBusVersion = value;
	}

	/**
	 * Check if xBusVersion information is available
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
}
