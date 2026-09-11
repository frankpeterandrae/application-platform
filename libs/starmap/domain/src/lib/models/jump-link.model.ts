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

export const JUMP_LINK_TYPES: ReadonlyArray<{
	value: JumpLinkStatus;
	label: string;
}> = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Vorsicht', value: 'caution' },
	{ label: 'Gefährlich', value: 'dangerous' },
	{ label: 'Blockiert', value: 'blocked' },
	{ label: 'Verloren', value: 'lost' }
];
