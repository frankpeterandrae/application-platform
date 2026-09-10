/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StarMapFileService, StarMapStore } from '@application-platform/starmap-data-access';
import { firstValueFrom } from 'rxjs';

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
	private readonly http = inject(HttpClient);
	private readonly starMapFileService = inject(StarMapFileService);
	private readonly store = inject(StarMapStore);

	protected title = 'starmap';

	ngOnInit(): void {
		void this.loadMap();
	}

	private async loadMap(): Promise<void> {
		const content = await firstValueFrom(
			this.http.get('/assets/maps/starmap.json', {
				responseType: 'text'
			})
		);

		const map = this.starMapFileService.deserialize(content);

		this.store.setMap(map);
	}
}
