/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../types/domain';

/**
 * Base shape for protocol-derived domain events.
 *
 * Every event retains the raw protocol bytes for diagnostics.
 */
export type Event<TDomain extends Domain, TEvent extends string, TPayload = Record<string, unknown>> = {
	event: `${TDomain}.event.${TEvent}`;
	payload: TPayload & { raw: number[] };
};
