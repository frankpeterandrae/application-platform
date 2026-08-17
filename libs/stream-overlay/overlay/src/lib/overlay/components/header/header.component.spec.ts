/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StreamStateService } from '@application-platform/stream-overlay-data-access';
import { beforeEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
	const title = signal<string | undefined>(undefined);
	const subtitle = signal<string | undefined>(undefined);

	beforeEach(async () => {
		title.set(undefined);
		subtitle.set(undefined);

		await setupTestingModule({
			imports: [HeaderComponent],
			providers: [
				{
					provide: StreamStateService,
					useValue: {
						title,
						subtitle
					}
				}
			]
		});
	});

	it('should not render title or subtitle when no stream state is available', () => {
		const fixture = TestBed.createComponent(HeaderComponent);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('h1')).toBeNull();
		expect(fixture.nativeElement.querySelector('h2')).toBeNull();
	});

	it('should render the stream title', () => {
		title.set('Miniaturen bemalen');

		const fixture = TestBed.createComponent(HeaderComponent);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Live: Miniaturen bemalen');
	});

	it('should render the stream subtitle', () => {
		subtitle.set('Sky Lantern');

		const fixture = TestBed.createComponent(HeaderComponent);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe('Sky Lantern');
	});

	it('should react to stream state changes', () => {
		const fixture = TestBed.createComponent(HeaderComponent);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('h1')).toBeNull();

		title.set('Blood Angels');
		subtitle.set('Sanguinary Guard');

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Live: Blood Angels');
		expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe('Sanguinary Guard');
	});
});
