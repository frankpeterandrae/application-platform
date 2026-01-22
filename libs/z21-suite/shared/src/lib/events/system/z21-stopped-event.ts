/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

/**
 * Event emitted when the command station has stopped.
 */
export type Z21StoppedEvent = Event<Domain.SYSTEM, 'stopped'>;
