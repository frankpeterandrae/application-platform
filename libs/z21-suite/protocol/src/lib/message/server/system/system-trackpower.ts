/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PowerPayload } from '@application-platform/z21-shared';

import type { Message } from '../../message-types';

/**
 * Reports track power state and optional fault flags.
 */
export type SystemTrackPower = Message<'system', 'trackpower', PowerPayload>;
