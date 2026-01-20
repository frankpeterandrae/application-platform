/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * CommandMessage sent by the client to trigger an emergency stop for all locomotives.
 */
export type StopAll = CommandMessage<'loco', 'stop.all'>;
