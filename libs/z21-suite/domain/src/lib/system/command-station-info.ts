export type CommandStationVersion = {
	xbusVersion?: number;
	versionString?: string;
	cmdsId?: number;
	raw?: number[];
};

/**
 * Command Station Information
 * Holds information about the connected command station
 */
export class CommandStationInfo {
	private version?: CommandStationVersion;

	/**
	 *  Get Command Station Version Information
	 */
	public getVersion(): CommandStationVersion | undefined {
		return this.version;
	}

	/**
	 * Set Command Station Version Information
	 * @param value - version information
	 */
	public setVersion(value: CommandStationVersion): void {
		this.version = value;
	}

	/**
	 * Check if version information is available
	 */
	public hasVersion(): boolean {
		return !!this.version;
	}
}
