/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandStationInfo } from '@application-platform/domain';
import type { Z21CommandService } from '@application-platform/z21';

/**
 * Orchestrates the retrieval of command station information by managing
 * requests for firmware version, xBus version, hardware info, and code.
 * Ensures that requests are sent in a prioritized manner and handles retries.
 */
export class CommandStationInfoOrchestrator {
	private req = {
		firmware: { inFlight: false, lastSent: 0 },
		xBusVersion: { inFlight: false, lastSent: 0 },
		hwinfo: { inFlight: false, lastSent: 0 },
		code: { inFlight: false, lastSent: 0 }
	};

	constructor(
		private readonly commandStationInfo: CommandStationInfo,
		private readonly z21CommandService: Z21CommandService
	) {}

	/**
	 * Resets the internal state of the orchestrator, clearing any in-flight requests
	 */
	public reset(): void {
		this.req = {
			firmware: { inFlight: false, lastSent: 0 },
			xBusVersion: { inFlight: false, lastSent: 0 },
			hwinfo: { inFlight: false, lastSent: 0 },
			code: { inFlight: false, lastSent: 0 }
		};
	}

	/**
	 * Initiates requests for command station information as needed.
	 * Prioritizes firmware version, then hardware info or xBus version,
	 * and finally code if applicable.
	 */
	public poke(): void {
		const now = Date.now();

		if (this.trySendFirmware(now)) return;

		// firmware must be known from here on
		if (!this.commandStationInfo.hasFirmwareVersion()) return;

		if (this.trySendHwOrXBus(now)) return;

		// hardware type must be known from here on
		if (this.commandStationInfo.hasHardwareType()) {
			this.trySendCode(now);
		}
	}

	/**
	 * Acknowledges the receipt of a specific type of command station information,
	 * marking the corresponding request as no longer in flight.
	 * @param type - The type of information acknowledged ('firmware', 'xBusVersion', 'hwinfo', or 'code')
	 */
	public ack(type: 'firmware' | 'xBusVersion' | 'hwinfo' | 'code'): void {
		this.req[type].inFlight = false;
	}

	private shouldSend(r: { inFlight: boolean; lastSent: number }, now: number, retryMs = 1000): boolean {
		return !r.inFlight || now - r.lastSent > retryMs;
	}

	// Helper: try to request firmware version. Returns true if a request was sent.
	private trySendFirmware(now: number): boolean {
		if (!this.commandStationInfo.hasFirmwareVersion() && this.shouldSend(this.req.firmware, now)) {
			this.req.firmware.inFlight = true;
			this.req.firmware.lastSent = now;
			this.z21CommandService.getFirmwareVersion();
			return true;
		}
		return false;
	}

	// Helper: try to request either hardware info (when supported) or xBus version.
	// Returns true if a request was sent.
	private trySendHwOrXBus(now: number): boolean {
		const fw = this.commandStationInfo.getFirmwareVersion();
		const supportsHwInfo = !!fw && (fw.major > 1 || (fw.major === 1 && fw.minor >= 20));

		if (supportsHwInfo) {
			if (!this.commandStationInfo.hasHardwareType() && this.shouldSend(this.req.hwinfo, now)) {
				this.req.hwinfo.inFlight = true;
				this.req.hwinfo.lastSent = now;
				this.z21CommandService.getHardwareInfo();
				return true;
			}
			return false;
		}

		// when hwinfo not supported, ask for xBus version
		if (!this.commandStationInfo.hasXBusVersion() && this.shouldSend(this.req.xBusVersion, now)) {
			this.req.xBusVersion.inFlight = true;
			this.req.xBusVersion.lastSent = now;
			this.z21CommandService.getXBusVersion();
			return true;
		}

		return false;
	}

	// Helper: try to request code when hardware type needs it.
	private trySendCode(now: number): boolean {
		const hw = this.commandStationInfo.getHardwareType();
		const needsCode = hw === 'z21_START' || hw === 'z21_SMALL';

		if (needsCode && !this.commandStationInfo.hasCode() && this.shouldSend(this.req.code, now)) {
			this.req.code.inFlight = true;
			this.req.code.lastSent = now;
			this.z21CommandService.getCode();
			return true;
		}

		return false;
	}
}
