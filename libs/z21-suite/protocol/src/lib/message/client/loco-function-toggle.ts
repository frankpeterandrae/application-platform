/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Toggles a locomotive function between on and off states.
 */
export type LocoFunctionToggle = {
	type: 'loco.command.function.toggle';
	addr: number;
	fn: number;
};
