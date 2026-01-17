/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Sets a locomotive function to a specific state (on/off).
 */
export type LocoFunctionSet = {
	type: 'loco.command.function.set';
	addr: number;
	fn: number;
	on: boolean;
};
