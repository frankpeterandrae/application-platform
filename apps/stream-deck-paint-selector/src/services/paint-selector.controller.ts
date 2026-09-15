/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PaintSelector, PaintSelectorButton } from '@application-platform/paint-selector';
import type { KeyAction } from '@elgato/streamdeck';

import { StreamOverlayClient } from './stream-overlay.client';

const STREAM_DECK_COLUMNS = 8;

interface VisibleAction {
	readonly action: KeyAction;
	readonly slotIndex: number;
}

/**
 * Coordinates all visible paint selector keys.
 */
export class PaintSelectorController {
	private readonly visibleActions = new Map<string, VisibleAction>();

	private readonly client = new StreamOverlayClient();

	private selector?: PaintSelector;

	private initialization?: Promise<void>;

	/**
	 * Initialize the controller
	 */
	public async initialize(): Promise<void> {
		if (!this.initialization) {
			this.initialization = this.loadSelector();
		}

		await this.initialization;
	}

	/**
	 * Registers a visible Stream Deck key.
	 *
	 * @param id The action context ID.
	 * @param action The key action instance.
	 * @param row The key row.
	 * @param column The key column.
	 */
	public register(id: string, action: KeyAction, row: number, column: number): void {
		this.visibleActions.set(id, {
			action,
			slotIndex: row * STREAM_DECK_COLUMNS + column
		});
	}

	/**
	 * Removes a key that is no longer visible.
	 *
	 * @param id The action context ID.
	 */
	public unregister(id: string): void {
		this.visibleActions.delete(id);
	}

	/**
	 * Renders the current state of the paint selector on the Stream Deck.
	 *
	 * @param id The action ID of the Stream Deck key to render.
	 */
	public async press(id: string): Promise<void> {
		const visibleAction = this.visibleActions.get(id);

		if (!visibleAction || !this.selector) {
			return;
		}

		this.selector.press(visibleAction.slotIndex);

		await this.render();
	}

	/**
	 * Updates all currently visible keys.
	 */
	public async render(): Promise<void> {
		if (!this.selector) {
			return;
		}

		const slots = this.selector.slots;

		await Promise.all(
			[...this.visibleActions.values()].map(async ({ action, slotIndex }) => {
				const slot = slots[slotIndex];

				await action.setTitle(slot ? this.getButtonTitle(slot.button) : '');
			})
		);
	}

	private async loadSelector(): Promise<void> {
		const [brands, paints, recentPaintIds] = await Promise.all([
			this.client.getBrands(),
			this.client.getPaints(),
			this.client.getRecentPaints()
		]);

		this.selector = new PaintSelector({
			brands,
			paints: [...paints].sort((a, b) => a.sku.localeCompare(b.sku)),
			recentPaintIds
		});
	}

	private getButtonTitle(button: PaintSelectorButton): string {
		switch (button.type) {
			case 'empty':
				return '';
			default:
				return button.label;
		}
	}
}
