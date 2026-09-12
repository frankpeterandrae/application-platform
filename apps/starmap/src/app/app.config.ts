/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserFilePersistenceService, FILE_PERSISTENCE } from '@application-platform/shared-ui';
import { STAR_MAP_WORKSPACE } from '@application-platform/starmap-data-access';
import { provideFastSVG } from '@push-based/ngx-fast-svg';
import { isTauri } from '@tauri-apps/api/core';

import { appRoutes } from './app.routes';
import { BrowserStarMapWorkspaceService } from './persistence/browser-star-map-workspace.service';
import { StarMapAutosaveService } from './persistence/star-map-autosave.service';
import { TauriFilePersistenceService } from './persistence/tauri-file-persistence.service';
import { TauriStarMapWorkspaceService } from './persistence/tauri-star-map-workspace.service';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideHttpClient(),
		provideRouter(appRoutes),

		provideFastSVG({
			url: (path: string) => {
				return path.includes('/') ? `/assets/${path}.svg` : `/assets/svg/${path}.svg`;
			}
		}),

		BrowserFilePersistenceService,
		TauriFilePersistenceService,
		BrowserStarMapWorkspaceService,
		TauriStarMapWorkspaceService,
		StarMapAutosaveService,
		{
			provide: FILE_PERSISTENCE,
			useFactory: (
				browserPersistence: BrowserFilePersistenceService,
				tauriPersistence: TauriFilePersistenceService
			): BrowserFilePersistenceService | TauriFilePersistenceService => {
				return isTauri() ? tauriPersistence : browserPersistence;
			},
			deps: [BrowserFilePersistenceService, TauriFilePersistenceService]
		},
		{
			provide: STAR_MAP_WORKSPACE,
			useFactory: (
				browserWorkspace: BrowserStarMapWorkspaceService,
				tauriWorkspace: TauriStarMapWorkspaceService
			): BrowserStarMapWorkspaceService | TauriStarMapWorkspaceService => {
				return isTauri() ? tauriWorkspace : browserWorkspace;
			},
			deps: [BrowserStarMapWorkspaceService, TauriStarMapWorkspaceService]
		}
	]
};
