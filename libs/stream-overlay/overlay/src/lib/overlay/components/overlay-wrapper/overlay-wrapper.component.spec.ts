/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { OverlayWrapperComponent } from './overlay-wrapper.component';

describe('OverlayWrapperComponent', () => {
	beforeEach(async () => {
		await setupTestingModule({
			imports: [OverlayWrapperComponent]
		});
	});

	it('should create', () => {
		const fixture = createComponent();

		expect(fixture.componentInstance).toBeTruthy();
		expect(fixture.nativeElement.querySelector('stream-overlay-header')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('stream-overlay-current-paint')).not.toBeNull();
	});

	function createComponent() {
		const fixture = TestBed.createComponent(OverlayWrapperComponent);
		fixture.detectChanges();

		return fixture;
	}
});
