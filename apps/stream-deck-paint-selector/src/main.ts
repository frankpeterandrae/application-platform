/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import streamDeck from '@elgato/streamdeck';

import { PaintSelectorAction } from './actions/paint-selector.action';

streamDeck.logger.info('Paint Selector plugin starting');

streamDeck.actions.registerAction(new PaintSelectorAction());

streamDeck.logger.info('Paint Selector action registered');

streamDeck.connect();
