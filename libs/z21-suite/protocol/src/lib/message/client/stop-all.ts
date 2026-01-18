/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Message sent by the client to trigger an emergency stop for all locomotives.
 */
export type StopAll = {
	type: 'loco.command.stop.all';
};
