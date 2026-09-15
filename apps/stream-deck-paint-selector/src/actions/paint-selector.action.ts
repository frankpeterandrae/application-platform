/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type KeyDownEvent, SingletonAction, type WillAppearEvent, type WillDisappearEvent } from '@elgato/streamdeck';

import { PaintSelectorController } from '../services/paint-selector.controller';

const controller = new PaintSelectorController();

/**
 * Provides the paint selector action on Stream Deck keys.
 */
export class PaintSelectorAction extends SingletonAction {
	public override readonly manifestId = 'de.frankpeterandrae.paint-selector.select';

	/**
	 * Registers the action with the controller when it appears on the Stream Deck.
	 *
	 * @param event The Stream Deck will-appear event.
	 */
	public override async onWillAppear(event: WillAppearEvent): Promise<void> {
		if (!event.action.isKey() || event.payload.isInMultiAction) {
			return;
		}

		const { row, column } = event.payload.coordinates;

		controller.register(event.action.id, event.action, row, column);

		await controller.initialize();
		await controller.render();
	}

	/**
	 * Unregisters the action from the controller when it disappears from the Stream Deck.
	 *
	 * @param event The Stream Deck will-disappear event.
	 */
	public override onWillDisappear(event: WillDisappearEvent): void {
		controller.unregister(event.action.id);
	}

	/**
	 * Handles a key press.
	 *
	 * @param event The Stream Deck key-down event.
	 */
	public override async onKeyDown(event: KeyDownEvent): Promise<void> {
		await controller.press(event.action.id);
	}
}
