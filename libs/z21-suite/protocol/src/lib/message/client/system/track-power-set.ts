/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * Toggles track power on or off.
 */
export type TrackPowerSet = CommandMessage<'system', 'trackpower.set', { powerOn: boolean }>;
