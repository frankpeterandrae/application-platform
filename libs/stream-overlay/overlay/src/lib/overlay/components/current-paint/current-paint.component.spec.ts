/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Paint } from '@application-platform/paint';
import { PaintService } from '@application-platform/stream-overlay-data-access';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { CurrentPaintComponent } from './current-paint.component';

describe('CurrentPaintComponent', () => {
	const currentPaint = signal<Paint | undefined>(undefined);

	beforeEach(async () => {
		currentPaint.set(undefined);

		await setupTestingModule({
			imports: [CurrentPaintComponent],
			providerOverrides: [{ provide: PaintService, useValue: { currentPaint } }]
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should create', () => {
		const fixture = createComponent();

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should not render overlay without current paint', () => {
		const fixture = createComponent();

		expect(fixture.nativeElement.querySelector('.paint-overlay')).toBeNull();
	});

	it('should render current paint', () => {
		vi.useFakeTimers();

		currentPaint.set({
			id: 'citadel:21-03',
			brand: 'citadel',
			sku: '21-03',
			name: 'Mephiston Red',
			mainColor: '#991115',
			colorGroups: ['red']
		});

		const fixture = createComponent();
		vi.advanceTimersByTime(500);
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('strong')?.textContent?.trim()).toBe('Mephiston Red');

		expect(fixture.nativeElement.querySelector('.paint-color')).not.toBeNull();
	});

	it('should not render current paint before transition duration has elapsed', () => {
		vi.useFakeTimers();

		currentPaint.set({
			id: 'citadel:21-03',
			brand: 'citadel',
			sku: '21-03',
			name: 'Mephiston Red',
			mainColor: '#991115',
			colorGroups: ['red']
		});

		const fixture = createComponent();

		expect(fixture.nativeElement.querySelector('.paint-overlay')).toBeNull();

		vi.advanceTimersByTime(499);
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.paint-overlay')).toBeNull();

		vi.advanceTimersByTime(1);
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.paint-overlay')).not.toBeNull();
	});

	it('should discard a pending paint when another paint is selected during the transition', () => {
		vi.useFakeTimers();

		const firstPaint: Paint = {
			id: 'citadel:21-03',
			brand: 'citadel',
			sku: '21-03',
			name: 'Mephiston Red',
			mainColor: '#991115',
			colorGroups: ['red']
		};

		const secondPaint: Paint = {
			id: 'citadel:22-01',
			brand: 'citadel',
			sku: '22-01',
			name: 'Khorne Red',
			mainColor: '#650001',
			colorGroups: ['red']
		};

		currentPaint.set(firstPaint);

		const fixture = createComponent();

		vi.advanceTimersByTime(250);

		currentPaint.set(secondPaint);
		fixture.detectChanges();

		vi.advanceTimersByTime(250);
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.paint-overlay')).toBeNull();

		vi.advanceTimersByTime(250);
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('strong')?.textContent?.trim()).toBe('Khorne Red');
	});

	function createComponent() {
		const fixture = TestBed.createComponent(CurrentPaintComponent);
		fixture.detectChanges();

		return fixture;
	}
});
