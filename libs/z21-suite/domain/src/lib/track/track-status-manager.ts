/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type TrackStatus } from './track-types';

/**
 * Manages and merges track power/status state coming from X-Bus power events
 * and system state messages, keeping track of the last authoritative source.
 */
export class TrackStatusManager {
	private status: TrackStatus = {};

	/**
	 * Returns a shallow copy of the current track status to prevent external mutation.
	 */
	public getStatus(): TrackStatus {
		return { ...this.status };
	}

	/**
	 * Applies a power update from X-Bus (authoritative for powerOn) and marks source.
	 * @param on - Whether track power is currently on.
	 * @returns Updated track status.
	 */
	public updateFromXbusPower(on: boolean): TrackStatus {
		this.status = { ...this.status, powerOn: on, source: 'ds.x.bus' };
		return this.getStatus();
	}

	/**
	 * Applies flags derived from system state, respecting X-Bus power precedence.
	 * Power flag uses X-Bus value if present; other flags always update from system state.
	 * @param flags - Derived flags from a system state message.
	 * @returns Updated track status.
	 */
	public updateFromSystemState(flags: TrackStatus): TrackStatus {
		const powerOn = this.status.source === 'ds.x.bus' && this.status.powerOn !== undefined ? this.status.powerOn : flags.powerOn;

		this.status = {
			powerOn,
			emergencyStop: flags.emergencyStop,
			short: flags.short,
			source: this.status.source ?? 'ds.system.state'
		};

		return this.getStatus();
	}
}
