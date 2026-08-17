/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { StreamStateService } from './stream-state.service';

describe('StreamStateService', () => {
	let service: StreamStateService;

	beforeEach(() => {
		service = new StreamStateService();
	});

	it('should initially return an empty state', () => {
		expect(service.getState()).toEqual({});
	});

	it('should update the title', () => {
		service.updateState({
			title: 'Miniaturen bemalen'
		});

		expect(service.getState()).toEqual({
			title: 'Miniaturen bemalen'
		});
	});

	it('should update the subtitle', () => {
		service.updateState({
			subtitle: 'Sky Lantern'
		});

		expect(service.getState()).toEqual({
			subtitle: 'Sky Lantern'
		});
	});

	it('should preserve existing state properties when applying a partial update', () => {
		service.updateState({
			title: 'Miniaturen bemalen',
			subtitle: 'Sky Lantern'
		});

		service.updateState({
			title: 'Blood Angels'
		});

		expect(service.getState()).toEqual({
			title: 'Blood Angels',
			subtitle: 'Sky Lantern'
		});
	});
});
