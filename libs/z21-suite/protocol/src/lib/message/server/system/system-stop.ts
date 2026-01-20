/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Message sent by the server to indicate that the system has stopped.
 */
export type SystemStop = Message<'system', 'stop'>;
