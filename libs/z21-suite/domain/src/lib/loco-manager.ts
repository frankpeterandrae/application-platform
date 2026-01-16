/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Direction, type LocoInfo } from '@application-platform/z21-shared';

export type LocoState = {
	speed: number;
	dir: Direction;
	fns: Record<number, boolean>;
	estop?: boolean;
};

/**
 * Manages locomotive states (speed, direction, functions) by address.
 */
export class LocoManager {
	private readonly locos = new Map<number, LocoState>();

	// Meta separat, not part of the state
	private readonly locoInfoSubscribed = new Set<number>();

	/**
	 * Gets the state of a locomotive by address.
	 * @param addr - Locomotive address
	 * @returns The current state or undefined if not tracked
	 */
	public getState(addr: number): LocoState | undefined {
		return this.locos.get(addr);
	}

	/**
	 * Returns a shallow copy of all locomotive states keyed by address.
	 */
	public getAllStates(): Map<number, LocoState> {
		return new Map(this.locos);
	}

	/**
	 * Sets speed and direction for a locomotive, clamping speed to [0,1].
	 * Creates a default state if the locomotive was not previously tracked.
	 * @param addr - Locomotive address
	 * @param speed - Desired speed (normalized 0..1)
	 * @param dir - Desired direction
	 * @returns A copy of the updated locomotive state
	 */
	public setSpeed(addr: number, speed: number, dir: Direction): LocoState {
		const st = this.locos.get(addr) ?? { speed: 0, dir: 'FWD', fns: {} };
		st.speed = this.clamp01(speed);
		st.dir = dir;
		this.locos.set(addr, st);
		return { ...st };
	}

	/**
	 * Sets a function state for a locomotive, creating a default state if needed.
	 * @param addr - Locomotive address
	 * @param fn - Function number
	 * @param on - Function active flag
	 * @returns A copy of the updated locomotive state
	 */
	public setFunction(addr: number, fn: number, on: boolean): LocoState {
		const st = this.locos.get(addr) ?? { speed: 0, dir: 'FWD', fns: {} };
		st.fns[fn] = on;
		this.locos.set(addr, st);
		return { ...st };
	}

	/**
	 * Stops all tracked locomotives (speed -> 0) and returns their states.
	 * @returns Array of address/state pairs after stopping
	 */
	public stopAll(): Array<{ addr: number; state: LocoState }> {
		const result: Array<{ addr: number; state: LocoState }> = [];
		for (const [addr, st] of this.locos.entries()) {
			st.speed = 0;
			result.push({ addr, state: { ...st } });
		}
		return result;
	}

	/**
	 * Clamps a numeric value to the range [0, 1], returning 0 for non-finite values.
	 * @param v - Value to clamp
	 * @returns Clamped value in [0, 1]
	 */
	private clamp01(v: number): number {
		if (!Number.isFinite(v)) return 0;
		if (v < 0) return 0;
		if (v > 1) return 1;
		return v;
	}

	/**
	 * Ensures a locomotive state exists for the given address.
	 * If not, creates a default state with speed 0, direction 'FWD', and no functions.
	 * @param addr - Locomotive address
	 * @returns A copy of the locomotive state
	 */
	public ensureLoco(addr: number): LocoState {
		const st = this.locos.get(addr) ?? { speed: 0, dir: 'FWD', fns: {} };
		this.locos.set(addr, st);
		return { ...st };
	}

	/**
	 * Subscribes to locomotive info updates for the given address only once.
	 * If already subscribed, returns false. Otherwise, adds to subscription set and returns true.
	 * @param addr - Locomotive address
	 * @returns True if subscription was added, false if already subscribed
	 */
	public subscribeLocoInfoOnce(addr: number): boolean {
		// eslint-disable-next-line no-console
		console.log('before ensureLoco', addr, this.locoInfoSubscribed.has(addr));
		this.ensureLoco(addr);
		// eslint-disable-next-line no-console
		console.log('afert ensureLoco', addr, this.locoInfoSubscribed.has(addr));
		if (this.locoInfoSubscribed.has(addr)) {
			return false;
		}

		this.locoInfoSubscribed.add(addr);
		return true;
	}

	/**
	 * Updates locomotive state from received LocoInfo data.
	 * @param locoInfo - LocoInfo data from Z21
	 * @returns The address and updated state of the locomotive
	 */
	public updateLocoInfoFromZ21(locoInfo: LocoInfo): { addr: number; state: LocoState } {
		const st = this.locos.get(locoInfo.addr) ?? { speed: 0, dir: 'FWD', fns: {} };
		st.speed = locoInfo.speed;
		st.dir = locoInfo.forward ? 'FWD' : 'REV';
		st.fns = { ...locoInfo.functionMap };
		st.estop = locoInfo.emergencyStop;

		this.locos.set(locoInfo.addr, st);

		return { addr: locoInfo.addr, state: st };
	}
}
