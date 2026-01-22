/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain, PowerPayload } from '../../types';
import { Event } from '../event';

export type TrackPowerEvent = Event<Domain.SYSTEM, 'track.power', PowerPayload>;
