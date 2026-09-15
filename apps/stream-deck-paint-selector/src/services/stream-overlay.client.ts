/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';

const STREAM_OVERLAY_URL = 'http://localhost:3000';

/**
 * Loads paint-selector data from the stream-overlay server.
 */
export class StreamOverlayClient {
	/**
	 * Gets the brands from the server
	 */
	public async getBrands(): Promise<PaintBrandDefinition[]> {
		return this.get<PaintBrandDefinition[]>('/api/paint-brands');
	}

	/**
	 * Gest the painst from the server
	 */
	public async getPaints(): Promise<Paint[]> {
		return this.get<Paint[]>('/api/paints');
	}

	/**
	 * Gets the recent paints form the server
	 */
	public async getRecentPaints(): Promise<PaintId[]> {
		return this.get<PaintId[]>('/api/recent');
	}

	private async get<T>(path: string): Promise<T> {
		const response = await fetch(`${STREAM_OVERLAY_URL}${path}`);

		if (!response.ok) {
			throw new Error(`Request failed: ${response.status} ${response.statusText}`);
		}

		return response.json() as Promise<T>;
	}
}
