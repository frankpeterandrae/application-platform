/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserFileService } from '@application-platform/shared-ui';
import { StarMapStore } from '@application-platform/starmap-data-access';
import { StarMap } from '@application-platform/starmap-domain';
import { BrowserSvgPersistenceService, SVG_PERSISTENCE } from '@application-platform/starmap-map';

import { setupTestingModule } from '../../test-setup';

import { StarmapEditorComponent } from './starmap-editor.component';

describe('StarmapEditorComponent', () => {
	let component: StarmapEditorComponent;
	let fixture: ComponentFixture<StarmapEditorComponent>;
	let store: StarMapStore;

	const map: StarMap = {
		id: 'map',
		name: 'Test Map',
		systems: [
			{
				id: 'S001',
				name: 'Sol',
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				stars: [],
				planets: []
			},
			{
				id: 'S005',
				name: 'Alpha',
				position: {
					x: 1,
					y: 1,
					z: 0
				},
				stars: [],
				planets: []
			},
			{
				id: 'custom',
				name: 'Custom',
				position: {
					x: 2,
					y: 2,
					z: 0
				},
				stars: [],
				planets: []
			}
		],
		jumpLinks: [],
		nebulae: [
			{
				id: 'N001',
				name: 'Purple Cloud',
				style: 'cloud',
				color: '#7a2f8f',
				opacity: 0.35,
				points: [
					{ x: 0, y: 0, z: 0 },
					{ x: 1, y: 0, z: 0 },
					{ x: 0, y: 1, z: 0 }
				]
			}
		]
	};

	beforeEach(async () => {
		await setupTestingModule({
			imports: [StarmapEditorComponent],
			providers: [
				BrowserSvgPersistenceService,
				{
					provide: SVG_PERSISTENCE,
					useExisting: BrowserSvgPersistenceService
				}
			]
		});

		store = TestBed.inject(StarMapStore);

		store.setMap(structuredClone(map));

		fixture = TestBed.createComponent(StarmapEditorComponent);

		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should build menu items from systems and nebulae', () => {
		expect((component as any).menuItems()).toEqual([
			{
				id: 'system:S001',
				label: 'Sol'
			},
			{
				id: 'system:S005',
				label: 'Alpha'
			},
			{
				id: 'system:custom',
				label: 'Custom'
			},
			{
				id: 'nebula:N001',
				label: 'Purple Cloud'
			}
		]);
	});

	it('should select a system menu item', () => {
		(component as any).selectMenuItem({
			id: 'system:S005',
			label: 'Alpha'
		});

		expect((component as any).editorSelection()).toEqual({
			type: 'system',
			id: 'S005'
		});

		expect(store.selectedSystemId()).toBe('S005');

		expect((component as any).selectedSystem()?.id).toBe('S005');

		expect((component as any).selectedNebula()).toBeNull();
	});

	it('should select a nebula menu item and clear the selected system', () => {
		store.selectSystem('S001');

		(component as any).selectMenuItem({
			id: 'nebula:N001',
			label: 'Purple Cloud'
		});

		expect((component as any).editorSelection()).toEqual({
			type: 'nebula',
			id: 'N001'
		});

		expect(store.selectedSystemId()).toBeNull();

		expect((component as any).selectedNebula()?.id).toBe('N001');

		expect((component as any).selectedSystem()).toBeNull();
	});

	it('should ignore a malformed menu item', () => {
		(component as any).selectMenuItem({
			id: 'invalid',
			label: 'Invalid'
		});

		expect((component as any).editorSelection()).toBeNull();
	});

	it('should toggle the editor', () => {
		expect((component as any).editorOpen()).toBe(true);

		(component as any).toggleEditor();

		expect((component as any).editorOpen()).toBe(false);

		(component as any).toggleEditor();

		expect((component as any).editorOpen()).toBe(true);
	});

	it('should update the selected system', () => {
		(component as any).selectMenuItem({
			id: 'system:S001',
			label: 'Sol'
		});

		const updated = {
			...map.systems[0],
			name: 'Updated Sol'
		};

		(component as any).saveSystem(updated);

		expect(store.map()?.systems.find((system) => system.id === 'S001')?.name).toBe('Updated Sol');
	});

	it('should create the next sequential system id', () => {
		(component as any).createSystem();

		const currentMap = store.map();

		expect(currentMap?.systems.some((system) => system.id === 'S006')).toBe(true);

		expect((component as any).editorSelection()).toEqual({
			type: 'system',
			id: 'S006'
		});
	});

	it('should ignore non-standard system ids when calculating the next id', () => {
		(component as any).createSystem();

		expect(store.map()?.systems.some((system) => system.id === 'S006')).toBe(true);
	});

	it('should not create a system when no map exists', () => {
		store.clear();

		(component as any).createSystem();

		expect(store.map()).toBeNull();
	});

	it('should create a nebula and select it', () => {
		const before = store.map()!.nebulae.length;

		(component as any).createNebula();

		const currentMap = store.map()!;

		expect(currentMap.nebulae).toHaveLength(before + 1);

		const created = currentMap.nebulae.at(-1)!;

		expect(created).toMatchObject({
			name: 'Neuer Nebel',
			style: 'cloud',
			color: '#7a2f8f',
			opacity: 0.35
		});

		expect(created.points).toHaveLength(3);

		expect((component as any).editorSelection()).toEqual({
			type: 'nebula',
			id: created.id
		});

		expect(store.selectedSystemId()).toBeNull();
	});

	it('should delete a system', () => {
		(component as any).deleteSystem('S001');

		expect(store.map()?.systems.some((system) => system.id === 'S001')).toBe(false);
	});

	it('should delete a nebula and clear the editor selection', () => {
		(component as any).selectMenuItem({
			id: 'nebula:N001',
			label: 'Purple Cloud'
		});

		(component as any).deleteNebula('N001');

		expect(store.map()?.nebulae).toHaveLength(0);

		expect((component as any).editorSelection()).toBeNull();
	});

	it('should return no menu items when no map exists', () => {
		store.clear();

		expect((component as any).menuItems()).toEqual([]);
	});

	it('should load a map from a file', async () => {
		const loadedMap: StarMap = {
			id: 'loaded-map',
			name: 'Loaded Map',
			systems: [],
			jumpLinks: [],
			nebulae: []
		};

		const content = JSON.stringify({
			version: 1,
			map: loadedMap
		});

		const file = {
			text: vi.fn().mockResolvedValue(content)
		};

		const input = {
			files: [file],
			value: 'starmap.json'
		};

		await (component as any).loadMap({
			target: input
		} as unknown as Event);

		expect(store.map()).toEqual(loadedMap);
		expect((component as any).editorSelection()).toBeNull();
		expect(store.selectedSystemId()).toBeNull();
		expect(input.value).toBe('');
	});

	it('should not load a map when no file is selected', async () => {
		const originalMap = store.map();

		const input = {
			files: [],
			value: ''
		};

		await (component as any).loadMap({
			target: input
		} as unknown as Event);

		expect(store.map()).toEqual(originalMap);
	});

	it('should save the current map as json', () => {
		const browserFileService = TestBed.inject(BrowserFileService);

		const saveSpy = vi.spyOn(browserFileService, 'save').mockImplementation(() => undefined);

		(component as any).saveMap();

		expect(saveSpy).toHaveBeenCalledWith(expect.any(String), 'test-map.json', 'application/json;charset=utf-8');

		const content = saveSpy.mock.calls[0][0];

		expect(JSON.parse(content)).toEqual({
			version: 1,
			map
		});
	});

	it('should not save when no map exists', () => {
		const browserFileService = TestBed.inject(BrowserFileService);

		const saveSpy = vi.spyOn(browserFileService, 'save').mockImplementation(() => undefined);

		store.clear();

		(component as any).saveMap();

		expect(saveSpy).not.toHaveBeenCalled();
	});

	it('should execute the create system toolbar action', () => {
		const button = (component as any).toolbarButtons.find((button: any) => button.buttonText === 'Neues System');

		button.callback();

		expect(store.map()?.systems).toHaveLength(4);
	});

	it('should execute the create nebula toolbar action', () => {
		const button = (component as any).toolbarButtons.find((button: any) => button.buttonText === 'Neuer Nebel');

		button.callback();

		expect(store.map()?.nebulae).toHaveLength(2);
	});

	it('should execute the save map toolbar action', () => {
		const browserFileService = TestBed.inject(BrowserFileService);

		const saveSpy = vi.spyOn(browserFileService, 'save').mockImplementation(() => undefined);

		const button = (component as any).toolbarButtons.find((button: any) => button.buttonText === 'Karte speichern');

		button.callback();

		expect(saveSpy).toHaveBeenCalled();
	});
});
