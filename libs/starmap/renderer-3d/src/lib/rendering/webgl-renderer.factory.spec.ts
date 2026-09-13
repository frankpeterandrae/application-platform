/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { WebGLRenderer } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebglRendererFactory } from './webgl-renderer.factory';

vi.mock('three', () => ({
	WebGLRenderer: vi.fn()
}));

describe('WebglRendererFactory', () => {
	let factory: WebglRendererFactory;

	beforeEach(() => {
		vi.clearAllMocks();

		factory = new WebglRendererFactory();
	});

	it('should create an antialiased WebGL renderer', () => {
		factory.create();

		expect(WebGLRenderer).toHaveBeenCalledWith({
			antialias: true
		});
	});
});
