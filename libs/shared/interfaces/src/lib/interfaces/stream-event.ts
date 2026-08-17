/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * WebSocket event names used for stream state synchronization.
 */
export const StreamEvent = {
	GetState: 'stream.get-state',
	UpdateState: 'stream.update-state',
	StateChanged: 'stream.state-changed'
} as const;
