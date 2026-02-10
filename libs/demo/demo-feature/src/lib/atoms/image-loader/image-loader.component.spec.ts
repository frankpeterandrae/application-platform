/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { ImageLoaderDemoComponent } from './image-loader.component';

/**
 * DeepMock implementation of IntersectionObserver for testing purposes.
 */
class MockIntersectionObserver {
	/**
	 * DeepMock observe method.
	 */
	public observe = vi.fn();

	/**
	 * DeepMock unobserve method.
	 */
	public unobserve = vi.fn();

	/**
	 * DeepMock disconnect method.
	 */
	public disconnect = vi.fn();
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe('ImageLoaderDemoComponent', () => {
	let component: ImageLoaderDemoComponent;
	let fixture: ComponentFixture<ImageLoaderDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ImageLoaderDemoComponent]
		});

		fixture = TestBed.createComponent(ImageLoaderDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
