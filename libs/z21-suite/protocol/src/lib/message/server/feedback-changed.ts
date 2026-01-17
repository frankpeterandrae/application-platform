/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Sources that can emit feedback events.
 * 'RBUS', 'CAN', and 'LOCONET' correspond to supported bus types.
 */
export type SourceType = 'RBUS' | 'CAN' | 'LOCONET';

/**
 * Reports a feedback sensor change from a given source.
 */
export type FeedbackChanged = {
	type: 'feedback.message.changed';
	source: SourceType;
	addr: number;
	value: 0 | 1;
};
