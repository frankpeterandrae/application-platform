/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Represents a decoded Z21 dataset from a UDP buffer.
 *
 * Variants:
 * - xBus: X-BUS tunneled frame. `xHeader` is the first X-BUS byte, `data` is the payload without the trailing XOR.
 * - systemState: Fixed-length 16-byte Z21 system state packet.
 * - unknown: Any unrecognized header or unexpected payload length, returned as-is for observability.
 */
export type Z21Dataset =
	| { kind: 'ds.x.bus'; xHeader: number; data: Uint8Array }
	| { kind: 'ds.system.state'; state: Uint8Array }
	| { kind: 'ds.unknown'; header: number; payload: Uint8Array };
