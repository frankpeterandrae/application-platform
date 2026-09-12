/*
 * Copyright (c) 2026. Frank-Peter Andr
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { StarMapWorkspace } from '@application-platform/starmap-data-access';
import { firstValueFrom } from 'rxjs';

/**
 * Browser-side implementation of {@link StarMapWorkspace}.
 *
 * This service loads the Star Map workspace from the bundled JSON asset in the
 * Angular application and intentionally treats persistence as a no-op in the
 * browser.
 */
@Injectable()
export class BrowserStarMapWorkspaceService implements StarMapWorkspace {
	private readonly http = inject(HttpClient);

	/**
	 * Loads the workspace JSON from the application's assets directory.
	 *
	 * @returns A promise that resolves with the raw JSON content as a string.
	 */
	public load(): Promise<string> {
		return firstValueFrom(
			this.http.get('/assets/maps/starmap.json', {
				responseType: 'text'
			})
		);
	}

	/**
	 * Persists workspace content.
	 *
	 * In the browser implementation, saving is intentionally ignored because
	 * the workspace is read from a static asset.
	 *
	 * @param _content The serialized workspace content to save.
	 */
	public save(_content: string): Promise<void> {
		return Promise.resolve();
	}
}
