/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LocoInfoEventPayload, type Direction } from '@application-platform/z21-shared';

export type LocoState = {
	speed: number;
	dir: Direction;
	fns: Record<number, boolean>;
	estop: boolean;
};

/**
 * Manages locomotive states (speed, direction, functions) by address.
 */
export class LocoManager {
	private readonly locos = new Map<number, LocoState>();

	private readonly locoInfoSubscribed = new Set<number>();

	/**
	 * Returns the state of a locomotive.
	 *
	 * @param addr - Locomotive address.
	 * @returns A copy of the current state, or undefined if the locomotive is not tracked.
	 */
	public getState(addr: number): LocoState | undefined {
		const state = this.locos.get(addr);
		return state ? this.copyState(state) : undefined;
	}

	/**
	 * Returns copies of all tracked locomotive states keyed by address.
	 *
	 * @returns A new map containing copies of the tracked locomotive states.
	 */
	public getAllStates(): Map<number, LocoState> {
		return new Map(Array.from(this.locos, ([addr, state]) => [addr, this.copyState(state)]));
	}

	/**
	 * Updates the speed and direction of a locomotive.
	 *
	 * Creates a default state when the locomotive is not yet tracked.
	 * Speed values are normalized to the range 0–1.
	 *
	 * @param addr - Locomotive address.
	 * @param speed - Desired normalized speed.
	 * @param dir - Desired direction of travel.
	 * @returns A copy of the updated locomotive state.
	 */
	public setSpeed(addr: number, speed: number, dir: Direction): LocoState {
		const state = this.locos.get(addr) ?? this.createDefaultState();

		state.speed = this.clamp01(speed);
		state.dir = dir;

		this.locos.set(addr, state);

		return this.copyState(state);
	}

	/**
	 * Updates a locomotive function.
	 *
	 * Creates a default state when the locomotive is not yet tracked.
	 *
	 * @param addr - Locomotive address.
	 * @param fn - Function number.
	 * @param on - Whether the function is active.
	 * @returns A copy of the updated locomotive state.
	 */
	public setFunction(addr: number, fn: number, on: boolean): LocoState {
		const state = this.locos.get(addr) ?? this.createDefaultState();

		state.fns[fn] = on;
		this.locos.set(addr, state);

		return this.copyState(state);
	}

	/**
	 * Stops all tracked locomotives by setting their speed to zero.
	 *
	 * Other locomotive state such as direction, functions and emergency-stop state
	 * remains unchanged.
	 *
	 * @returns The addresses and resulting states of all tracked locomotives.
	 */
	public stopAll(): Array<{ addr: number; state: LocoState }> {
		const result: Array<{ addr: number; state: LocoState }> = [];

		for (const [addr, state] of this.locos.entries()) {
			state.speed = 0;

			result.push({
				addr,
				state: this.copyState(state)
			});
		}

		return result;
	}

	private copyState(state: LocoState): LocoState {
		return {
			...state,
			fns: { ...state.fns }
		};
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
	 * Ensures that a locomotive state exists for the given address.
	 *
	 * A newly created locomotive starts stopped, facing forward, without active
	 * functions and without emergency stop.
	 *
	 * @param addr - Locomotive address.
	 * @returns A copy of the locomotive state.
	 */
	public ensureLoco(addr: number): LocoState {
		const state = this.locos.get(addr) ?? this.createDefaultState();

		this.locos.set(addr, state);

		return this.copyState(state);
	}

	/**
	 * Marks locomotive-info subscription as requested for an address.
	 *
	 * Ensures that a state exists for the locomotive and returns true only for the
	 * first subscription request for that address.
	 *
	 * @param addr - Locomotive address.
	 * @returns True when the address was newly subscribed, otherwise false.
	 */
	public subscribeLocoInfoOnce(addr: number): boolean {
		this.ensureLoco(addr);

		if (this.locoInfoSubscribed.has(addr)) {
			return false;
		}

		this.locoInfoSubscribed.add(addr);

		return true;
	}

	/**
	 * Updates a locomotive state from a received Z21 locomotive-info event.
	 *
	 * The reported speed, direction, functions and emergency-stop state replace
	 * the corresponding locally stored values.
	 *
	 * @param locoInfo - Locomotive information received from the Z21.
	 * @returns The locomotive address and a copy of the updated state.
	 */
	public updateLocoInfoFromZ21(locoInfo: LocoInfoEventPayload): { addr: number; state: LocoState } {
		const state = this.locos.get(locoInfo.addr) ?? this.createDefaultState();

		state.speed = locoInfo.speed;
		state.dir = locoInfo.direction;
		state.fns = { ...locoInfo.functionMap };
		state.estop = locoInfo.emergencyStop;

		this.locos.set(locoInfo.addr, state);

		return {
			addr: locoInfo.addr,
			state: this.copyState(state)
		};
	}

	private createDefaultState(): LocoState {
		return {
			speed: 0,
			dir: 'FWD',
			fns: {},
			estop: false
		};
	}
}
