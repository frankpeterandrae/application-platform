/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { encodeLanXSetTrackPowerOff, encodeLanXSetTrackPowerOn } from '../codec/frames';
import { type Z21Udp } from '../udp/udp';

/**
 * Service for controlling Z21 model railroad command station via UDP.
 * Provides methods to send track power commands and demo payloads.
 */
export class Z21Service {
	/**
	 * Creates an instance of Z21Service.
	 * @param udp - The UDP transport service for communicating with Z21.
	 */
	constructor(private readonly udp: Z21Udp) {}

	/**
	 * Sends a track power command to the Z21 device.
	 * @param on - Whether to enable (true) or disable (false) track power.
	 */
	public sendTrackPower(on: boolean): void {
		const buf = on ? encodeLanXSetTrackPowerOn() : encodeLanXSetTrackPowerOff();
		this.udp.sendRaw(buf);
	}

	/**
	 * Sends a demo payload (0xDEADBEEF) to the Z21 device for testing purposes.
	 */
	public demoPing(): void {
		this.udp.sendRaw(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
	}
}
