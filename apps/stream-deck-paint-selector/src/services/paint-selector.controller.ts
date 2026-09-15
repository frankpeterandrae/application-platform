/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PaintId } from '@application-platform/paint';
import { PAINT_SELECTOR_HOME_SLOT, PaintSelector } from '@application-platform/paint-selector';
import streamDeck, { type KeyAction } from '@elgato/streamdeck';

import { PaintSelectorButtonRenderer } from './paint-selector-button.renderer';
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
	private readonly buttonRenderer = new PaintSelectorButtonRenderer();

	private selector?: PaintSelector;

	private initialization?: Promise<void>;
	private recentPaintIds: PaintId[] = [];

	/**
	 * Initialize the controller
	 */
	public async initialize(): Promise<void> {
		this.initialization ??= this.loadSelector().catch((error: unknown) => {
			streamDeck.logger.error(`Failed to initialize Paint Selector: ${String(error)}`);

			this.initialization = undefined;
			this.selector = undefined;
		});

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

		if (!visibleAction) {
			return;
		}

		if (visibleAction.slotIndex === PAINT_SELECTOR_HOME_SLOT && !this.selector) {
			await streamDeck.profiles.switchToProfile(visibleAction.action.device.id);

			return;
		}

		if (!this.selector) {
			return;
		}

		const result = this.selector.press(visibleAction.slotIndex);

		switch (result.type) {
			case 'paint-selected':
				this.client.selectPaint(result.paint);
				this.updateRecentPaints(result.paint.id);
				break;

			case 'clear':
				this.client.clearPaint();
				break;

			case 'home':
				await streamDeck.profiles.switchToProfile(visibleAction.action.device.id);
				return;

			case 'none':
				break;
		}

		await this.render();
	}

	private updateRecentPaints(paintId: PaintId): void {
		this.recentPaintIds = [paintId, ...this.recentPaintIds.filter((id) => id !== paintId)].slice(0, 8);

		this.selector?.updateRecentPaints(this.recentPaintIds);
	}

	/**
	 * Updates all currently visible keys.
	 */
	public async render(): Promise<void> {
		if (!this.selector) {
			await this.renderOffline();

			return;
		}

		const slots = this.selector.slots;

		await Promise.all(
			[...this.visibleActions.values()].map(async ({ action, slotIndex }) => {
				const slot = slots[slotIndex];

				const view = this.buttonRenderer.render(slot.button);

				await Promise.all([action.setTitle(''), action.setImage(view.image)]);
			})
		);
	}

	private async renderOffline(): Promise<void> {
		await Promise.all(
			[...this.visibleActions.values()].map(async ({ action, slotIndex }) => {
				const view = this.buttonRenderer.renderOffline(slotIndex);

				await Promise.all([action.setTitle(''), action.setImage(view.image)]);
			})
		);
	}

	private async loadSelector(): Promise<void> {
		const [brands, paints, recentPaintIds] = await Promise.all([
			this.client.getBrands(),
			this.client.getPaints(),
			this.client.getRecentPaints()
		]);

		this.recentPaintIds = recentPaintIds;

		this.selector = new PaintSelector({
			brands,
			paints: [...paints].sort((a, b) => a.sku.localeCompare(b.sku)),
			recentPaintIds
		});
	}
}
