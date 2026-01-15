/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Dataset } from '../codec/codec-types';
import type { Z21Event, Z21SystemState } from '../z21/event-types';

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
			events: Z21Event[];
	  }
	| {
			type: 'system.state';
			header: number;
			len: number;
			rawHex: string;
			from: { address: string; port: number };
			payload: Z21SystemState;
	  };
