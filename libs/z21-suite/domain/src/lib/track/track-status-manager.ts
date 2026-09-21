/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PowerPayload } from '@application-platform/z21-shared';

import type { TrackStatus, TrackStatusSource } from './track-types';

/**
 * Maintains the current track power and fault state reported by the Z21.
 */
export class TrackStatusManager {
	private status: TrackStatus = {
		emergencyStop: false,
		powerOn: false,
		programmingMode: false,
		shortCircuit: false
	};

	/**
	 * Returns the current track status.
	 *
	 * @returns A copy of the current track status.
	 */
	public getStatus(): TrackStatus {
		return { ...this.status };
	}

	/**
	 * Replaces the complete track power and fault state.
	 *
	 * @param payload - Track power and fault state reported by the Z21.
	 * @param source - Protocol source of the update.
	 * @returns A copy of the updated track status.
	 */
	public updateStatus(payload: PowerPayload, source: TrackStatusSource): TrackStatus {
		this.status = {
			powerOn: payload.powerOn,
			emergencyStop: payload.emergencyStop,
			programmingMode: payload.programmingMode,
			shortCircuit: payload.shortCircuit,
			source
		};

		return this.getStatus();
	}

	/**
	 * Updates the emergency-stop state without changing the other track flags.
	 *
	 * @param isEmergency - Whether emergency stop is active.
	 * @param source - Protocol source of the update.
	 * @returns A copy of the updated track status.
	 */
	public setEmergencyStop(isEmergency: boolean, source: TrackStatusSource): TrackStatus {
		this.status = {
			...this.status,
			emergencyStop: isEmergency,
			source
		};

		return this.getStatus();
	}

	/**
	 * Updates the short-circuit state without changing the other track flags.
	 *
	 * @param shortCircuit - Whether a short circuit is active.
	 * @param source - Protocol source of the update.
	 * @returns A copy of the updated track status.
	 */
	public setShortCircuit(shortCircuit: boolean, source: TrackStatusSource): TrackStatus {
		this.status = {
			...this.status,
			shortCircuit,
			source
		};

		return this.getStatus();
	}
}
