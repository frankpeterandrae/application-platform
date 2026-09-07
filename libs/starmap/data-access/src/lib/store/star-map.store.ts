/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { computed, Injectable, signal } from '@angular/core';
import { JumpLink, Nebula, StarMap, StarSystem } from '@application-platform/starmap-domain';

/**
 * Service to manage the state of the star map.
 */
@Injectable({ providedIn: 'root' })
export class StarMapStore {
	private readonly mapState = signal<StarMap | null>(null);
	private readonly selectedSystemIdState = signal<string | null>(null);

	public readonly map = this.mapState.asReadonly();
	public readonly selectedSystemId = this.selectedSystemIdState.asReadonly();

	public readonly selectedSystem = computed(() => {
		const map = this.map();
		const selectedSystemId = this.selectedSystemId();

		if (!map || !selectedSystemId) {
			return null;
		}

		return map.systems.find((system) => system.id === selectedSystemId) ?? null;
	});

	/**
	 * Sets the current star map state.
	 * @param map
	 */
	public setMap(map: StarMap): void {
		this.mapState.set(map);
	}

	/**
	 * Clears the current star map state.
	 */
	public clear(): void {
		this.mapState.set(null);
		this.selectedSystemIdState.set(null);
	}

	/**
	 * Selects a star system by its ID.
	 * @param systemId The ID of the star system to select, or null to deselect.
	 */
	public selectSystem(systemId: string | null): void {
		this.selectedSystemIdState.set(systemId);
	}

	/**
	 * Updates a star system in the current star map state.
	 * @param updatedSystem The updated star system to be saved.
	 */
	public updateSystem(updatedSystem: StarSystem): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				systems: map.systems.map((system) => (system.id === updatedSystem.id ? updatedSystem : system))
			};
		});
	}

	/**
	 * Adds a new star system to the current star map state and selects it.
	 * @param system The new star system to be added.
	 */
	public addSystem(system: StarSystem): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				systems: [...map.systems, system]
			};
		});

		this.selectedSystemIdState.set(system.id);
	}

	/**
	 * Deletes a star system from the current star map state and deselects it if it was selected.
	 * @param systemId The ID of the star system to be deleted.
	 */
	public deleteSystem(systemId: string): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				systems: map.systems.filter((system) => system.id !== systemId),
				jumpLinks: map.jumpLinks.filter((link) => link.startSystemId !== systemId && link.endSystemId !== systemId)
			};
		});

		if (this.selectedSystemId() === systemId) {
			this.selectedSystemIdState.set(null);
		}
	}

	/**
	 * Adds a new jump link to the current star map state.
	 * @param link The new jump link to be added.
	 */
	public addJumpLink(link: JumpLink): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			const exists = map.jumpLinks.some(
				(existing) =>
					(existing.startSystemId === link.startSystemId && existing.endSystemId === link.endSystemId) ||
					(existing.startSystemId === link.endSystemId && existing.endSystemId === link.startSystemId)
			);

			if (exists) {
				return map;
			}

			return {
				...map,
				jumpLinks: [...map.jumpLinks, link]
			};
		});
	}

	/**
	 * Updates an existing jump link in the current star map state.
	 * @param updatedLink The updated jump link to be saved.
	 */
	public updateJumpLink(updatedLink: JumpLink): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				jumpLinks: map.jumpLinks.map((link) => (link.id === updatedLink.id ? updatedLink : link))
			};
		});
	}

	/**
	 * Deletes a jump link from the current star map state.
	 * @param linkId The ID of the jump link to be deleted.
	 */
	public deleteJumpLink(linkId: string): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				jumpLinks: map.jumpLinks.filter((link) => link.id !== linkId)
			};
		});
	}

	/**
	 * Adds a new nebula to the current star map state.
	 * @param nebula The new nebula to be added.
	 */
	public addNebula(nebula: Nebula): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				nebulae: [...map.nebulae, nebula]
			};
		});
	}

	/**
	 * Updates an existing nebula in the current star map state.
	 * @param updatedNebula The updated nebula to be saved.
	 */
	public updateNebula(updatedNebula: Nebula): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				nebulae: map.nebulae.map((nebula) => (nebula.id === updatedNebula.id ? updatedNebula : nebula))
			};
		});
	}

	/**
	 * Deletes a nebula from the current star map state.
	 * @param nebulaId The ID of the nebula to be deleted.
	 */
	public deleteNebula(nebulaId: string): void {
		this.mapState.update((map) => {
			if (!map) {
				return map;
			}

			return {
				...map,
				nebulae: map.nebulae.filter((nebula) => nebula.id !== nebulaId)
			};
		});
	}
}
