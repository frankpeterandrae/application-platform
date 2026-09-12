/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { StarMapWorkspace } from '@application-platform/starmap-data-access';
import { invoke } from '@tauri-apps/api/core';
import { firstValueFrom } from 'rxjs';

/**
 * Tauri-side implementation of {@link StarMapWorkspace}.
 */
@Injectable()
export class TauriStarMapWorkspaceService implements StarMapWorkspace {
	private readonly http = inject(HttpClient);

	/**
	 * Loads the workspace JSON from the configured workspace path.
	 */
	public async load(): Promise<string> {
		const content = await invoke<string | null>('load_starmap_workspace');

		if (content !== null) {
			return content;
		}

		return firstValueFrom(
			this.http.get('/assets/maps/starmap.json', {
				responseType: 'text'
			})
		);
	}

	/**
	 * Persists workspace content to the configured workspace path.
	 * @param content The serialized workspace content to save.
	 */
	public save(content: string): Promise<void> {
		return invoke<void>('save_starmap_workspace', {
			content
		});
	}
}
