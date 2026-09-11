/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { NgClass } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
	ButtonBarComponent,
	ButtonColorDefinition,
	ButtonComponent,
	ButtonConfigModel,
	CardComponent,
	IconDefinition,
	MenuItem,
	SidebarComponent
} from '@application-platform/shared/ui-theme';
import { createFileName, FILE_PERSISTENCE } from '@application-platform/shared-ui';
import { StarMapFileService, StarMapStore } from '@application-platform/starmap-data-access';
import { Nebula, randomSpectralType, StarSystem } from '@application-platform/starmap-domain';
import { StarmapComponent } from '@application-platform/starmap-map';

import { NebulaEditorComponent } from '../nebula-editor/nebula-editor.component';
import { SystemEditorComponent } from '../system-editor/system-editor.component';

import { StarmapIconDefinition } from './starmap-icon-definition';

type EditorSelection =
	| {
			type: 'system';
			id: string;
	  }
	| {
			type: 'nebula';
			id: string;
	  };

/**
 * Manages the star map editing workspace, including system and nebula selection,
 * editor state, creation actions and map-level commands.
 */
@Component({
	selector: 'starmap-editor-container',
	imports: [
		CardComponent,
		SystemEditorComponent,
		NebulaEditorComponent,
		StarmapComponent,
		SidebarComponent,
		ButtonBarComponent,
		ButtonComponent,
		NgClass
	],
	templateUrl: './starmap-editor.component.html',
	styleUrl: './starmap-editor.component.scss'
})
export class StarmapEditorComponent {
	protected readonly store = inject(StarMapStore);
	private readonly starMapFileService = inject(StarMapFileService);
	private readonly filePersistence = inject(FILE_PERSISTENCE);
	protected readonly iconDefinition = IconDefinition;

	protected readonly editorSelection = signal<EditorSelection | null>(null);
	protected readonly editorOpen = signal(true);
	private readonly starmap = viewChild<StarmapComponent>(StarmapComponent);

	protected readonly menuItems = computed<MenuItem[]>(() => {
		const map = this.store.map();

		if (!map) {
			return [];
		}

		return [
			...map.systems
				.map((system) => ({
					id: `system:${system.id}`,
					label: system.name,
					icon: StarmapIconDefinition.IMPERIAL_AQUILA
				}))
				.sort((a, b) => a.label.localeCompare(b.label)),
			...map.nebulae
				.map((nebula) => ({
					id: `nebula:${nebula.id}`,
					label: nebula.name,
					icon: this.getNebulaIcon(nebula.style)
				}))
				.sort((a, b) => a.label.localeCompare(b.label))
		];
	});

	private getNebulaIcon(style: string): StarmapIconDefinition | IconDefinition {
		switch (style) {
			case 'cloud':
				return StarmapIconDefinition.CHAOS_STAR;
			case 'outline':
				return IconDefinition.LOCATION;
			case 'haze':
			default:
				return IconDefinition.FOG;
		}
	}
	protected readonly selectedSystem = computed(() => {
		const selection = this.editorSelection();

		if (selection?.type !== 'system') {
			return null;
		}

		return this.store.map()?.systems.find((system) => system.id === selection.id) ?? null;
	});

	protected readonly selectedNebula = computed(() => {
		const selection = this.editorSelection();

		if (selection?.type !== 'nebula') {
			return null;
		}

		return this.store.map()?.nebulae.find((nebula) => nebula.id === selection.id) ?? null;
	});

	protected selectMenuItem(item: MenuItem): void {
		const [type, id] = item.id.split(':', 2);

		if (!id) {
			return;
		}

		if (type === 'system') {
			this.editorSelection.set({
				type: 'system',
				id
			});

			this.store.selectSystem(id);
			return;
		}

		if (type === 'nebula') {
			this.editorSelection.set({
				type: 'nebula',
				id
			});

			this.store.selectSystem(null);
		}
	}

	protected toggleEditor(): void {
		this.editorOpen.update((open) => !open);
	}

	protected readonly toolbarButtons: ButtonConfigModel[] = [
		{
			buttonText: 'Neues System',
			color: ButtonColorDefinition.PRIMARY,
			callback: () => this.createSystem()
		},
		{
			buttonText: 'Neuer Nebel',
			color: ButtonColorDefinition.PRIMARY,
			callback: () => this.createNebula()
		},
		{
			buttonText: 'Karte einpassen',
			color: ButtonColorDefinition.PRIMARY,
			callback: () => this.starmap()?.fitToViewport()
		},
		{
			buttonText: 'Karte laden',
			color: ButtonColorDefinition.PRIMARY,
			callback: () => void this.loadMap()
		},
		{
			buttonText: 'Karte speichern',
			color: ButtonColorDefinition.PRIMARY,
			callback: () => void this.saveMap()
		},
		{
			buttonText: 'SVG exportieren',
			color: ButtonColorDefinition.PRIMARY,
			callback: () => void this.starmap()?.exportSvg()
		}
	];

	protected saveSystem(system: StarSystem): void {
		this.store.updateSystem(system);
	}

	protected createSystem(): void {
		const map = this.store.map();

		if (!map) {
			return;
		}

		const id = this.nextSystemId(map.systems);

		const system: StarSystem = {
			id,
			name: id,
			faction: '',
			position: {
				x: 0,
				y: 0,
				z: 0
			},
			stars: [
				{
					spectralType: randomSpectralType()
				}
			],
			planets: []
		};

		this.store.addSystem(system);
		this.editorSelection.set({
			type: 'system',
			id: system.id
		});
	}

	protected createNebula(): void {
		const nebula: Nebula = {
			id: crypto.randomUUID(),
			name: 'Neuer Nebel',
			style: 'cloud',
			color: '#7a2f8f',
			opacity: 0.35,
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 1, y: 0, z: 0 },
				{ x: 0, y: 1, z: 0 }
			]
		};

		this.store.addNebula(nebula);

		this.editorSelection.set({
			type: 'nebula',
			id: nebula.id
		});

		this.store.selectSystem(null);
	}

	protected deleteSystem(systemId: string): void {
		this.store.deleteSystem(systemId);
	}

	private nextSystemId(systems: StarSystem[]): string {
		const highestNumber = systems.reduce((highest, system) => {
			const match = /^S(\d+)$/.exec(system.id);

			if (!match) {
				return highest;
			}

			return Math.max(highest, Number.parseInt(match[1], 10));
		}, 0);

		return `S${String(highestNumber + 1).padStart(3, '0')}`;
	}

	protected deleteNebula(nebulaId: string): void {
		this.store.deleteNebula(nebulaId);
		this.editorSelection.set(null);
	}

	protected async loadMap(): Promise<void> {
		const content = await this.filePersistence.open({
			extensions: ['json']
		});

		if (!content) {
			return;
		}

		const map = this.starMapFileService.deserialize(content);

		this.store.setMap(map);
		this.editorSelection.set(null);
		this.store.selectSystem(null);
	}

	private async saveMap(): Promise<void> {
		const map = this.store.map();

		if (!map) {
			return;
		}

		const content = this.starMapFileService.serialize(map);

		await this.filePersistence.save(content, {
			fileName: `${createFileName(map.name)}.json`,
			extensions: ['json'],
			mimeType: 'application/json;charset=utf-8'
		});
	}

	protected readonly ButtonColorDefinition = ButtonColorDefinition;
}
