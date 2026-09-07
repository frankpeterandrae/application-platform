/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StarMapStore } from '@application-platform/starmap-data-access';
import { StarMap } from '@application-platform/starmap-domain';
const demoMap: StarMap = {
	id: 'demo-map',
	name: 'Testsektor',

	systems: [
		{
			id: 'sol',
			name: 'Sol',
			faction: 'Imperium',
			position: { x: 10, y: 10, z: 0 },
			stars: [{ spectralType: 'G2' }],
			planets: []
		}
	],
	jumpLinks: [],
	nebulae: []
};
/**
 * The root component of the application.
 */
@Component({
	imports: [RouterModule],
	selector: 'starmap-root',
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	private readonly store = inject(StarMapStore);
	protected title = 'starmap';

	constructor() {
		this.store.setMap(demoMap);
	}
}
