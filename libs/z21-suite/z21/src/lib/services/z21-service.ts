/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { type Direction } from '@application-platform/z21-shared';

import { encodeLanXSetTrackPowerOff, encodeLanXSetTrackPowerOn, encodeLocoDrive128 } from '../codec/frames';
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
	 * Sends a locomotive drive command (speed and direction) to the Z21 device.
	 * Converts fractional speed (0-1) to 128-step DCC speed commands.
	 * @param address - Locomotive address (1-9999)
	 * @param speed - Fractional speed (0.0 = stop, 1.0 = full speed)
	 * @param forward - Direction ('FWD' for forward, 'REV' for reverse)
	 */
	public setLocoDrive(address: number, speed: number, forward: Direction): void {
		const buf = encodeLocoDrive128(address, speed, forward);
		// eslint-disable-next-line no-console
		console.log('[z21] tx LOCO_DRIVE', `addr=${address}`, `speed=${speed}`, forward, buf.toString('hex'));
		this.udp.sendRaw(buf);
	}

	/**
	 * Sends a demo payload (0xDEADBEEF) to the Z21 device for testing purposes.
	 */
	public demoPing(): void {
		this.udp.sendRaw(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
	}
}
