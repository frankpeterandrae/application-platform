/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DestroyRef, effect, EffectRef, inject, Injectable, Injector } from '@angular/core';
import { STAR_MAP_WORKSPACE, StarMapFileService, StarMapStore } from '@application-platform/starmap-data-access';

/**
 * Service responsible for automatically saving the star map after changes.
 */
@Injectable()
export class StarMapAutosaveService {
	private readonly store = inject(StarMapStore);
	private readonly workspace = inject(STAR_MAP_WORKSPACE);
	private readonly starMapFileService = inject(StarMapFileService);
	private readonly injector = inject(Injector);
	private readonly destroyRef = inject(DestroyRef);

	private autosaveEffect?: EffectRef;
	private timeout?: ReturnType<typeof setTimeout>;

	constructor() {
		this.destroyRef.onDestroy(() => {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
		});
	}

	/**
	 * Starts the autosave effect, which listens for changes in the star map and saves it after a delay.
	 */
	public start(): void {
		if (this.autosaveEffect) {
			return;
		}

		let initialMap = true;

		this.autosaveEffect = effect(
			() => {
				const map = this.store.map();

				if (!map) {
					return;
				}

				if (initialMap) {
					initialMap = false;
					return;
				}

				if (this.timeout) {
					clearTimeout(this.timeout);
				}

				this.timeout = setTimeout(() => {
					const content = this.starMapFileService.serialize(map);

					void this.workspace.save(content);
				}, 500);
			},
			{
				injector: this.injector
			}
		);
	}
}
