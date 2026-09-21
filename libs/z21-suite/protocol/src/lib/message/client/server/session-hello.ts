/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * Starts the client-server handshake and reports the client's protocol version.
 */
export type SessionHello = CommandMessage<'server', 'session.hello', { protocolVersion: string; clientName?: string }>;
