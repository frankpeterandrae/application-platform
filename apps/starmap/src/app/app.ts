/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { STAR_MAP_WORKSPACE, StarMapFileService, StarMapStore } from '@application-platform/starmap-data-access';

import { StarMapAutosaveService } from './persistence/star-map-autosave.service';

/**
 * The root component of the application.
 */
@Component({
	imports: [RouterModule],
	selector: 'starmap-root',
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App implements OnInit {
	private readonly workspace = inject(STAR_MAP_WORKSPACE);
	private readonly starMapFileService = inject(StarMapFileService);
	private readonly store = inject(StarMapStore);
	private readonly autosaveService = inject(StarMapAutosaveService);

	protected title = 'starmap';

	ngOnInit(): void {
		void this.loadMap();
	}

	private async loadMap(): Promise<void> {
		const content = await this.workspace.load();
		const map = this.starMapFileService.deserialize(content);

		this.store.setMap(map);
		this.autosaveService.start();
	}
}
