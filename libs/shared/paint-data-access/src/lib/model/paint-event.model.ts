/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * WebSocket event names used for paint synchronization.
 */
export const PaintEvent = {
	Select: 'paint.select',
	GetCurrent: 'paint.get-current',
	Changed: 'paint.changed',
	Clear: 'paint.clear'
} as const;
