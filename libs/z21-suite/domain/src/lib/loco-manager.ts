/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Direction = 'FWD' | 'REV';

export type LocoState = {
	speed: number;
	dir: Direction;
	fns: Record<number, boolean>;
};

/**
 * Manages locomotive states (speed, direction, functions) by address.
 */
export class LocoManager {
	private readonly locos = new Map<number, LocoState>();

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
}
