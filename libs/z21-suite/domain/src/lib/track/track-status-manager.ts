/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PowerPayload } from '@application-platform/z21-shared';

import type { TrackStatus } from './track-types';

/**
 * Manages and merges track power/status state coming from X-Bus power events
 * and system state messages, keeping track of the last authoritative source.
 */
export class TrackStatusManager {
	private status: TrackStatus = {
		emergencyStop: false,
		powerOn: false,
		programmingMode: false,
		shortCircuit: false,
		source: undefined
	};

	/**
	 * Returns a shallow copy of the current track status to prevent external mutation.
	 */
	public getStatus(): TrackStatus {
		return { ...this.status };
	}

	/**
	 * Applies a power update and marks source.
	 * @param payload - X-Bus track power event payload.
	 * @param source - Source of the power event.
	 * @returns Updated track status.
	 */
	public updateStatus(payload: PowerPayload, source: 'ds.x.bus' | 'ds.system.state' | 'ds.lan.x'): TrackStatus {
		this.status = {
			...this.status,
			powerOn: payload.powerOn,
			emergencyStop: payload.emergencyStop,
			programmingMode: payload.programmingMode,
			shortCircuit: payload.shortCircuit,
			source
		};
		return this.getStatus();
	}

	/**
	 * Sets the emergency stop state.
	 * @param isEmergency - Whether emergency stop is active
	 * @param source - Source of the emergency stop signal
	 * @returns The updated track status
	 */
	public setEmergencyStop(isEmergency: boolean, source: 'ds.x.bus' | 'ds.system.state' | 'ds.lan.x' | undefined): TrackStatus {
		this.status = {
			...this.status,
			emergencyStop: isEmergency,
			source
		};
		return this.getStatus();
	}

	/**
	 * Sets the shortCircuit circuit status directly.
	 *
	 * @param shortCircuit - The shortCircuit circuit status to set.
	 * @param source - The source of the update.
	 * @returns Updated track status.
	 */
	public setShortCircuit(shortCircuit: boolean, source: 'ds.x.bus' | 'ds.system.state' | 'ds.lan.x' | undefined): TrackStatus {
		this.status = {
			...this.status,
			shortCircuit: shortCircuit,
			source
		};
		return this.getStatus();
	}
}
