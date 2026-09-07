/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type JumpLinkStatus = 'normal' | 'caution' | 'dangerous' | 'blocked' | 'lost';

export interface JumpLink {
	id: string;
	startSystemId: string;
	endSystemId: string;
	status: JumpLinkStatus;
}
