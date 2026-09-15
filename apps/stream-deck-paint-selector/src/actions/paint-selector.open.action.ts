/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import streamDeck, { type KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
/**
 * Provides the paint selector action on Stream Deck keys.
 */
export class PaintSelectorOpenAction extends SingletonAction {
	public override readonly manifestId = 'de.frankpeterandrae.paint-selector.open';

	/**
	 * Handles a key press.
	 *
	 * @param event The Stream Deck key-down event.
	 */
	public override async onKeyDown(event: KeyDownEvent): Promise<void> {
		await streamDeck.profiles.switchToProfile(event.action.device.id, 'profiles/paint-selector');
	}
}
