/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21SystemState } from '@application-platform/z21-shared';

import type { Z21Dataset } from '../codec/codec-types';

/**
 * Unified shape for inbound Z21 UDP payloads raised by Z21Udp.
 * - serial: Z21 serial number response
 * - datasets: Parsed datasets plus derived events
 * - system.state: Parsed system state snapshot
 */
export type Z21RxPayload =
	| {
			type: 'serial';
			serial: number;
			header: number;
			len: number;
			rawHex: string;
			from: { address: string; port: number };
	  }
	| {
			type: 'datasets';
			header: number;
			len: number;
			rawHex: string;
			from: { address: string; port: number };
			datasets: Z21Dataset[];
	  }
	| {
			type: 'system.state';
			header: number;
			len: number;
			rawHex: string;
			from: { address: string; port: number };
			payload: Z21SystemState;
	  };
