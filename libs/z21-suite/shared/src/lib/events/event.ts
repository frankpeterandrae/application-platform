/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../types/domain';

export type Event<TDomain extends Domain, TEvent extends string, TPayload = Record<string, unknown>> = {
	event: `${TDomain}.event.${TEvent}`;
	payload: TPayload & { raw: number[] };
};
