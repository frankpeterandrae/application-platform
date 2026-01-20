/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * Announces protocol version and optional client name.
 * Initial handshake message sent by client to establish connection.
 */
export type SessionHello = CommandMessage<'server', 'session.hello', { protocolVersion: string; clientName?: string }>;
