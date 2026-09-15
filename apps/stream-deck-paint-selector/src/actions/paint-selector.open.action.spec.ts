/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { KeyDownEvent } from '@elgato/streamdeck';

const mocks = vi.hoisted(() => ({
	switchToProfile: vi.fn()
}));

vi.mock('@elgato/streamdeck', () => ({
	default: {
		profiles: {
			switchToProfile: mocks.switchToProfile
		}
	},
	SingletonAction: class {}
}));

import { PaintSelectorOpenAction } from './paint-selector.open.action';

describe('PaintSelectorOpenAction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.switchToProfile.mockResolvedValue(undefined);
	});

	it('should expose the correct manifest ID', () => {
		const action = new PaintSelectorOpenAction();

		expect(action.manifestId).toBe('de.frankpeterandrae.paint-selector.open');
	});

	it('should switch to the paint selector profile', async () => {
		const action = new PaintSelectorOpenAction();

		const event = {
			action: {
				device: {
					id: 'stream-deck-xl'
				}
			}
		} as unknown as KeyDownEvent;

		await action.onKeyDown(event);

		expect(mocks.switchToProfile).toHaveBeenCalledWith('stream-deck-xl', 'profiles/paint-selector');
	});
});
