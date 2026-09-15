/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { KeyDownEvent, WillAppearEvent, WillDisappearEvent } from '@elgato/streamdeck';

const mocks = vi.hoisted(() => ({
	register: vi.fn(),
	unregister: vi.fn(),
	initialize: vi.fn(),
	render: vi.fn(),
	press: vi.fn()
}));

vi.mock('../services/paint-selector.controller', () => ({
	PaintSelectorController: class {
		public readonly register = mocks.register;
		public readonly unregister = mocks.unregister;
		public readonly initialize = mocks.initialize;
		public readonly render = mocks.render;
		public readonly press = mocks.press;
	}
}));

import { PaintSelectorAction } from './paint-selector.action';

describe('PaintSelectorAction', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mocks.initialize.mockResolvedValue(undefined);
		mocks.render.mockResolvedValue(undefined);
		mocks.press.mockResolvedValue(undefined);
	});

	it('should expose the correct manifest ID', () => {
		const action = new PaintSelectorAction();

		expect(action.manifestId).toBe('de.frankpeterandrae.paint-selector.select');
	});

	it('should register and render a visible key', async () => {
		const action = new PaintSelectorAction();

		const keyAction = {
			id: 'action-1',
			isKey: vi.fn().mockReturnValue(true)
		};

		const event = {
			action: keyAction,
			payload: {
				isInMultiAction: false,
				coordinates: {
					row: 2,
					column: 3
				}
			}
		} as unknown as WillAppearEvent;

		await action.onWillAppear(event);

		expect(mocks.register).toHaveBeenCalledWith('action-1', keyAction, 2, 3);

		expect(mocks.initialize).toHaveBeenCalledOnce();
		expect(mocks.render).toHaveBeenCalledOnce();
	});

	it('should ignore non-key actions', async () => {
		const action = new PaintSelectorAction();

		const event = {
			action: {
				isKey: vi.fn().mockReturnValue(false)
			},
			payload: {
				isInMultiAction: false
			}
		} as unknown as WillAppearEvent;

		await action.onWillAppear(event);

		expect(mocks.register).not.toHaveBeenCalled();
		expect(mocks.initialize).not.toHaveBeenCalled();
		expect(mocks.render).not.toHaveBeenCalled();
	});

	it('should ignore actions inside multi actions', async () => {
		const action = new PaintSelectorAction();

		const event = {
			action: {
				isKey: vi.fn().mockReturnValue(true)
			},
			payload: {
				isInMultiAction: true
			}
		} as unknown as WillAppearEvent;

		await action.onWillAppear(event);

		expect(mocks.register).not.toHaveBeenCalled();
		expect(mocks.initialize).not.toHaveBeenCalled();
		expect(mocks.render).not.toHaveBeenCalled();
	});

	it('should unregister an action when it disappears', () => {
		const action = new PaintSelectorAction();

		const event = {
			action: {
				id: 'action-1'
			}
		} as unknown as WillDisappearEvent;

		action.onWillDisappear(event);

		expect(mocks.unregister).toHaveBeenCalledWith('action-1');
	});

	it('should forward key presses to the controller', async () => {
		const action = new PaintSelectorAction();

		const event = {
			action: {
				id: 'action-1'
			}
		} as unknown as KeyDownEvent;

		await action.onKeyDown(event);

		expect(mocks.press).toHaveBeenCalledWith('action-1');
	});
});
