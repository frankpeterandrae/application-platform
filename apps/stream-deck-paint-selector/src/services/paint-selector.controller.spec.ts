/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Paint, PaintBrandDefinition } from '@application-platform/paint';
import type { KeyAction } from '@elgato/streamdeck';

import { PaintSelectorController } from './paint-selector.controller';

const mocks = vi.hoisted(() => ({
	getBrands: vi.fn(),
	getPaints: vi.fn(),
	getRecentPaints: vi.fn(),
	selectPaint: vi.fn(),
	clearPaint: vi.fn(),

	render: vi.fn(),
	renderOffline: vi.fn(),

	switchToProfile: vi.fn(),
	loggerError: vi.fn()
}));

vi.mock('./stream-overlay.client', () => ({
	StreamOverlayClient: class {
		public readonly getBrands = mocks.getBrands;
		public readonly getPaints = mocks.getPaints;
		public readonly getRecentPaints = mocks.getRecentPaints;
		public readonly selectPaint = mocks.selectPaint;
		public readonly clearPaint = mocks.clearPaint;
	}
}));

vi.mock('./paint-selector-button.renderer', () => ({
	PaintSelectorButtonRenderer: class {
		public readonly render = mocks.render;
		public readonly renderOffline = mocks.renderOffline;
	}
}));

vi.mock('@elgato/streamdeck', () => ({
	default: {
		logger: {
			error: mocks.loggerError
		},
		profiles: {
			switchToProfile: mocks.switchToProfile
		}
	}
}));

const brands: PaintBrandDefinition[] = [
	{
		id: 'citadel',
		label: 'Citadel'
	}
];

const paints: Paint[] = [
	{
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		mainColor: '#960c09',
		colorGroups: ['red'],
		category: 'base'
	},
	{
		id: 'citadel:22-01',
		brand: 'citadel',
		sku: '22-01',
		name: 'Evil Sunz Scarlet',
		mainColor: '#c01411',
		colorGroups: ['red'],
		category: 'layer'
	}
];

function createAction(deviceId = 'device-1'): KeyAction {
	return {
		device: {
			id: deviceId
		},
		setTitle: vi.fn().mockResolvedValue(undefined),
		setImage: vi.fn().mockResolvedValue(undefined)
	} as unknown as KeyAction;
}

describe('PaintSelectorController', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mocks.getBrands.mockResolvedValue(brands);
		mocks.getPaints.mockResolvedValue(paints);
		mocks.getRecentPaints.mockResolvedValue([]);

		mocks.render.mockReturnValue({
			image: 'rendered-image'
		});

		mocks.renderOffline.mockReturnValue({
			image: 'offline-image'
		});

		mocks.switchToProfile.mockResolvedValue(undefined);
	});

	it('should initialize the paint selector', async () => {
		const controller = new PaintSelectorController();

		await controller.initialize();

		expect(mocks.getBrands).toHaveBeenCalledOnce();
		expect(mocks.getPaints).toHaveBeenCalledOnce();
		expect(mocks.getRecentPaints).toHaveBeenCalledOnce();
	});

	it('should initialize only once', async () => {
		const controller = new PaintSelectorController();

		await controller.initialize();
		await controller.initialize();

		expect(mocks.getBrands).toHaveBeenCalledOnce();
		expect(mocks.getPaints).toHaveBeenCalledOnce();
		expect(mocks.getRecentPaints).toHaveBeenCalledOnce();
	});

	it('should retry initialization after a failed attempt', async () => {
		mocks.getBrands.mockRejectedValueOnce(new Error('Server offline')).mockResolvedValueOnce(brands);

		const controller = new PaintSelectorController();

		await controller.initialize();
		await controller.initialize();

		expect(mocks.getBrands).toHaveBeenCalledTimes(2);
		expect(mocks.loggerError).toHaveBeenCalledWith('Failed to initialize Paint Selector: Error: Server offline');
	});

	it('should calculate the slot index from row and column', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		controller.register('action-1', action, 1, 2);

		await controller.render();

		expect(mocks.renderOffline).toHaveBeenCalledWith(10);
	});

	it('should unregister a visible action', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		controller.register('action-1', action, 1, 2);
		controller.unregister('action-1');

		await controller.render();

		expect(mocks.renderOffline).not.toHaveBeenCalled();
	});

	it('should render the offline state when the selector is not initialized', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		controller.register('action-1', action, 1, 4);

		await controller.render();

		expect(mocks.renderOffline).toHaveBeenCalledWith(12);
		expect(action.setTitle).toHaveBeenCalledWith('');
		expect(action.setImage).toHaveBeenCalledWith('offline-image');
	});

	it('should render selector buttons after initialization', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		// slot 8 = first brand on the home page
		controller.register('action-1', action, 1, 0);

		await controller.initialize();
		await controller.render();

		expect(mocks.render).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'brand',
				label: 'Citadel'
			})
		);

		expect(action.setTitle).toHaveBeenCalledWith('');
		expect(action.setImage).toHaveBeenCalledWith('rendered-image');
	});

	it('should ignore an unknown action when pressed', async () => {
		const controller = new PaintSelectorController();

		await controller.initialize();
		await controller.press('unknown');

		expect(mocks.selectPaint).not.toHaveBeenCalled();
		expect(mocks.clearPaint).not.toHaveBeenCalled();
		expect(mocks.switchToProfile).not.toHaveBeenCalled();
	});

	it('should return to the previous profile from the offline home button', async () => {
		const controller = new PaintSelectorController();
		const action = createAction('stream-deck-xl');

		// row 3, column 0 = slot 24 = Home
		controller.register('home', action, 3, 0);

		await controller.press('home');

		expect(mocks.switchToProfile).toHaveBeenCalledWith('stream-deck-xl');
	});

	it('should ignore non-home buttons while offline', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		controller.register('action-1', action, 0, 0);

		await controller.press('action-1');

		expect(mocks.selectPaint).not.toHaveBeenCalled();
		expect(mocks.clearPaint).not.toHaveBeenCalled();
		expect(mocks.switchToProfile).not.toHaveBeenCalled();
	});

	it('should return to the previous profile from the selector home page', async () => {
		const controller = new PaintSelectorController();
		const action = createAction('stream-deck-xl');

		controller.register('home', action, 3, 0);

		await controller.initialize();
		await controller.press('home');

		expect(mocks.switchToProfile).toHaveBeenCalledWith('stream-deck-xl');
	});

	it('should clear the selected paint', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		// row 3, column 1 = slot 25 = Clear on home page
		controller.register('clear', action, 3, 1);

		await controller.initialize();
		await controller.press('clear');

		expect(mocks.clearPaint).toHaveBeenCalledOnce();
	});

	it('should send a selected recent paint to the server', async () => {
		mocks.getRecentPaints.mockResolvedValue(['citadel:21-03']);

		const controller = new PaintSelectorController();
		const action = createAction();

		// recent paints start at slot 0
		controller.register('paint', action, 0, 0);

		await controller.initialize();
		await controller.press('paint');

		expect(mocks.selectPaint).toHaveBeenCalledWith(paints[0]);
	});

	it('should navigate into a brand without sending a server event', async () => {
		const controller = new PaintSelectorController();
		const action = createAction();

		// slot 8 = first brand
		controller.register('brand', action, 1, 0);

		await controller.initialize();
		await controller.press('brand');

		expect(mocks.selectPaint).not.toHaveBeenCalled();
		expect(mocks.clearPaint).not.toHaveBeenCalled();
		expect(mocks.switchToProfile).not.toHaveBeenCalled();

		expect(mocks.render).toHaveBeenCalled();
	});
});
