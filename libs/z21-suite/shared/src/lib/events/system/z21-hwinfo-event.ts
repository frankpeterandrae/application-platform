/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

/**
 * Maps Z21 hardware identifiers to their known device types.
 */
export const HARDWARE_TYPE_BY_ID = {
	0x00000200: 'Z21_OLD',
	0x00000201: 'Z21_NEW',
	0x00000202: 'SMARTRAIL',
	0x00000203: 'z21_SMALL',
	0x00000204: 'z21_START',
	0x00000205: 'SINGLE_BOOSTER',
	0x00000206: 'DUAL_BOOSTER',
	0x00000211: 'Z21_XL',
	0x00000212: 'XL_BOOSTER',
	0x00000301: 'Z21_SWITCH_DECODER',
	0x00000302: 'Z21_SIGNAL_DECODER'
} as const;

export type HardwareType = (typeof HARDWARE_TYPE_BY_ID)[keyof typeof HARDWARE_TYPE_BY_ID];

export type Z21HwinfoEvent = Event<
	Domain.SYSTEM,
	'hwinfo',
	{
		majorVersion: number;
		minorVersion: number;
		hardwareType: HardwareType | 'UNKNOWN';
	}
>;
