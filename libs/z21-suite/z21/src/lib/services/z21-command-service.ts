/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Direction, Logger, Z21LanHeader } from '@application-platform/z21-shared';

import { type LocoFunctionSwitchType } from '../constants';
import { encodeXBusLanFrame } from '../helper/x-bus-encoder';
import {
	encodeLanXGetFirmwareVersion,
	encodeLanXGetLocoInfo,
	encodeLanXGetTurnoutInfo,
	encodeLanXGetVersion,
	encodeLanXSetLocoEStop,
	encodeLanXSetLocoFunction,
	encodeLanXSetStop,
	encodeLanXSetTrackPowerOff,
	encodeLanXSetTrackPowerOn,
	encodeLanXSetTurnout,
	encodeLanXSystemStatus,
	encodeLocoDrive128
} from '../lanx/encoder';
import { type Z21Udp } from '../udp/udp';

/**
 * Service for controlling Z21 model railroad command station via UDP.
 * Provides methods to send track power commands and demo payloads.
 */
export class Z21CommandService {
	private readonly turnoutOffTimers = new Map<number, NodeJS.Timeout>();
	/**
	 * Creates an instance of Z21CommandService.
	 * @param udp - The UDP transport service for communicating with Z21.
	 * @param logger - Logger instance for logging messages.
	 */
	constructor(
		private readonly udp: Z21Udp,
		private readonly logger: Logger
	) {}

	/**
	 * Sends a track power command to the Z21 device.
	 * @param on - Whether to enable (true) or disable (false) track power.
	 */
	public sendTrackPower(on: boolean): void {
		const buf = on ? encodeLanXSetTrackPowerOn() : encodeLanXSetTrackPowerOff();
		this.logger.debug('[z21] tx TRACK_POWER', { on: on ? 'ON' : 'OFF', hex: buf.toString('hex') });
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
		this.logger.debug('[z21] tx LOCO_DRIVE', { address, speed, forward, hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Set or toggle a locomotive function (F0..Fn).
	 *
	 * Encodes a LAN/X frame that contains an X-BUS LOCO_FUNCTION command and sends it.
	 * Logs the encoded frame hex for debugging.
	 *
	 * @param address - Locomotive address to apply the function change.
	 * @param fn - Function index (e.g. 0..31 depending on loco capability).
	 * @param on - One of the LocoFunctionSwitchType values (Off, On, Toggle).
	 */
	public setLocoFunction(address: number, fn: number, on: LocoFunctionSwitchType): void {
		const buf = encodeLanXSetLocoFunction(address, fn, on);
		this.logger.debug('[z21] tx LOCO_FUNCTION', { address, fn, on, hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Request locomotive information (CVs / capabilities) from the Z21.
	 *
	 * Encodes the LAN/X LOCO_INFO command and sends it to the central.
	 *
	 * @param address - Address of the locomotive to query.
	 */
	public getLocoInfo(address: number): void {
		const buf = encodeLanXGetLocoInfo(address);
		this.logger.debug('[z21] tx LOCO_INFO', { address, hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Request turnout information from the Z21.
	 *
	 * Encodes the LAN/X TURNOUT_INFO command and sends it to the central.
	 * @param address - Address of the turnout to query.
	 */
	public getTurnoutInfo(address: number): void {
		const buf = encodeLanXGetTurnoutInfo(address);
		this.logger.debug('[z21] tx TURNOUT_INFO', { address, hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Sets a turnout to a specified position with optional queuing and pulse duration.
	 * Sends an activation command followed by a deactivation command after the pulse duration.
	 * @param address - Turnout address
	 * @param port - Port (0 or 1) to set the turnout position
	 * @param opts - Optional settings:
	 *  - queue: Whether to queue the command (default: true)
	 *   - pulseMs: Duration in milliseconds before deactivating the turnout (default: 100ms)
	 */
	public setTurnout(address: number, port: 0 | 1, opts?: { queue?: boolean; pulseMs?: number }): void {
		const queueFlag = opts?.queue ?? true;
		const pulseMs = opts?.pulseMs ?? 100;

		const existingTimer = this.turnoutOffTimers.get(address);
		if (existingTimer) {
			clearTimeout(existingTimer);
			this.turnoutOffTimers.delete(address);
		}

		// Activate (A=1)
		const buf = encodeLanXSetTurnout(address, port, true, queueFlag);
		this.logger.debug('[z21] tx TURNOUT_SET', { address, port, A: 1, queue: queueFlag, hex: buf.toString('hex') });
		this.udp.sendRaw(buf);

		// Deactivate (A=0) after pulseMs
		const timer = setTimeout(() => {
			if (!this.turnoutOffTimers.has(address) || this.turnoutOffTimers.get(address) !== timer) {
				return;
			}

			this.turnoutOffTimers.delete(address);

			const bufOff = encodeLanXSetTurnout(address, port, false, queueFlag);
			this.logger.debug('[z21] tx LOCO_ESTOP', { address, hex: buf.toString('hex') });
			this.udp.sendRaw(bufOff);
		}, pulseMs);

		this.turnoutOffTimers.set(address, timer);
	}

	/**
	 * Sends an emergency stop command for a locomotive to the Z21 device.
	 *
	 * @param address - Locomotive address to emergency stop.
	 */
	public setLocoEStop(address: number): void {
		const buf = encodeLanXSetLocoEStop(address);
		// eslint-disable-next-line no-console
		console.log('[z21] tx LOCO_ESTOP', `addr=${address}`, buf.toString('hex'));
		this.udp.sendRaw(buf);
	}

	/**
	 * Requests the Z21 firmware version information.
	 */
	public getXBusVersion(): void {
		const buf = encodeLanXGetVersion();
		this.logger.debug('[z21] tx GET_VERSION', { hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Requests the Z21 status information.
	 */
	public getStatus(): void {
		const buf = encodeLanXSystemStatus();
		this.logger.debug('[z21] tx GET_STATUS', { hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Sends a global emergency stop command to the Z21 device.
	 */
	public setStop(): void {
		const buf = encodeLanXSetStop();
		this.logger.debug('[z21] tx SET_STOP', { hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Requests the Z21 firmware version information.
	 */
	public getFirmwareVersion(): void {
		const buf = encodeLanXGetFirmwareVersion();
		this.logger.debug('[z21] tx GET_FIRMWARE_VERSION', { hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Requests the Z21 hardware information.
	 */
	public getHardwareInfo(): void {
		const buf = encodeXBusLanFrame(Z21LanHeader.LAN_GET_HWINFO);
		this.logger.debug('[z21] tx GET_HARDWARE_INFO', { hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}

	/**
	 * Requests the Z21 command station code information.
	 */
	public getCode(): void {
		const buf = encodeXBusLanFrame(Z21LanHeader.LAN_GET_CODE);
		this.logger.debug('[z21] tx LAN_GET_CODE', { hex: buf.toString('hex') });
		this.udp.sendRaw(buf);
	}
}
