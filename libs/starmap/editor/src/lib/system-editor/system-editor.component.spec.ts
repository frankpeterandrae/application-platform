/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JumpLink, StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { SystemEditorComponent } from './system-editor.component';

describe('SystemEditorComponent', () => {
	let component: SystemEditorComponent;
	let fixture: ComponentFixture<SystemEditorComponent>;

	const systems: StarSystem[] = [
		{
			id: 'S001',
			name: 'Sol',
			faction: 'Imperium',
			position: {
				x: 1,
				y: 2,
				z: 3
			},
			stars: [
				{
					spectralType: 'G2'
				}
			],
			planets: [
				{
					id: 'P001',
					name: 'Terra',
					type: 'terran',
					classification: 'Hive World'
				}
			]
		},
		{
			id: 'S002',
			name: 'Alpha',
			position: {
				x: 4,
				y: 5,
				z: 6
			},
			stars: [],
			planets: []
		},
		{
			id: 'S003',
			name: 'Beta',
			position: {
				x: 7,
				y: 8,
				z: 9
			},
			stars: [],
			planets: []
		}
	];

	const jumpLinks: JumpLink[] = [
		{
			id: 'J001',
			startSystemId: 'S001',
			endSystemId: 'S002',
			status: 'normal'
		}
	];

	beforeEach(async () => {
		await setupTestingModule({
			imports: [SystemEditorComponent]
		});

		fixture = TestBed.createComponent(SystemEditorComponent);

		component = fixture.componentInstance;

		fixture.componentRef.setInput('system', systems[0]);

		fixture.componentRef.setInput('systems', systems);

		fixture.componentRef.setInput('jumpLinks', jumpLinks);

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize the form from the selected system', () => {
		const form = (component as any).form;

		expect(form.controls.name.value).toBe('Sol');

		expect(form.controls.faction.value).toBe('Imperium');

		expect(form.controls.x.value).toBe(1);

		expect(form.controls.y.value).toBe(2);

		expect(form.controls.z.value).toBe(3);

		expect((component as any).stars).toHaveLength(1);

		expect((component as any).planets).toHaveLength(1);
	});

	it('should update the form when the system input changes', () => {
		fixture.componentRef.setInput('system', systems[1]);

		fixture.detectChanges();

		const form = (component as any).form;

		expect(form.controls.name.value).toBe('Alpha');

		expect((component as any).stars).toHaveLength(0);

		expect((component as any).planets).toHaveLength(0);
	});

	it('should emit the changed system when the form changes', () => {
		const emitted: StarSystem[] = [];

		component.systemChanged.subscribe((value) => emitted.push(value));

		const form = (component as any).form;

		form.patchValue({
			name: 'New Sol',
			faction: 'Mechanicus',
			x: 10,
			y: 20,
			z: -5
		});

		expect(emitted.at(-1)).toMatchObject({
			id: 'S001',
			name: 'New Sol',
			faction: 'Mechanicus',
			position: {
				x: 10,
				y: 20,
				z: -5
			}
		});
	});

	it('should convert an empty faction to undefined when saving', () => {
		const emitted: StarSystem[] = [];

		component.systemChanged.subscribe((value) => emitted.push(value));

		(component as any).form.controls.faction.setValue('');

		(component as any).emitSystem();

		expect(emitted[0].faction).toBeUndefined();
	});

	it('should not save an invalid form', () => {
		const emitted: StarSystem[] = [];

		component.systemChanged.subscribe((value) => emitted.push(value));

		(component as any).form.controls.name.setValue('');

		(component as any).emitSystem();

		expect(emitted).toHaveLength(0);
	});

	it('should add and remove stars', () => {
		const stars = (component as any).stars;

		expect(stars).toHaveLength(1);

		(component as any).addStar();

		expect(stars).toHaveLength(2);

		(component as any).removeStar(0);

		expect(stars).toHaveLength(1);
	});

	it('should randomize a star', () => {
		const stars = (component as any).stars;

		const previousValue = stars.at(0).value;

		(component as any).randomizeStar(0);

		expect(stars.at(0).value).toBeTruthy();

		expect(typeof stars.at(0).value).toBe('string');

		/*
		 * Nicht auf "ungleich vorher" testen:
		 * randomSpectralType() darf zufällig denselben
		 * Typ erneut liefern.
		 */
		expect(previousValue).toBeTruthy();
	});

	it('should add and remove planets', () => {
		const planets = (component as any).planets;

		expect(planets).toHaveLength(1);

		(component as any).addPlanet();

		expect(planets).toHaveLength(2);

		expect(planets.at(1).getRawValue()).toMatchObject({
			name: '',
			type: 'other',
			classification: ''
		});

		(component as any).removePlanet(1);

		expect(planets).toHaveLength(1);
	});

	it('should return jump links belonging to the current system', () => {
		expect((component as any).systemJumpLinks()).toEqual(jumpLinks);
	});

	it('should return only unconnected systems as new jump targets', () => {
		const targets = (component as any).availableJumpTargets();

		expect(targets.map((system: StarSystem) => system.id)).toEqual(['S003']);
	});

	it('should resolve the other system id', () => {
		expect((component as any).otherSystemId(jumpLinks[0])).toBe('S002');

		const reverseLink: JumpLink = {
			...jumpLinks[0],
			startSystemId: 'S002',
			endSystemId: 'S001'
		};

		expect((component as any).otherSystemId(reverseLink)).toBe('S002');
	});

	it('should resolve a system name', () => {
		expect((component as any).systemName('S002')).toBe('Alpha');

		expect((component as any).systemName('UNKNOWN')).toBe('UNKNOWN');
	});

	it('should not add an invalid jump link', () => {
		const emitted: JumpLink[] = [];

		component.jumpLinkCreated.subscribe((value) => emitted.push(value));

		(component as any).addJumpLink();

		expect(emitted).toHaveLength(0);
	});

	it('should add a jump link and reset the form', () => {
		const emitted: JumpLink[] = [];

		component.jumpLinkCreated.subscribe((value) => emitted.push(value));

		const form = (component as any).jumpLinkForm;

		form.setValue({
			targetSystemId: 'S003',
			status: 'caution'
		});

		(component as any).addJumpLink();

		expect(emitted).toHaveLength(1);

		expect(emitted[0]).toMatchObject({
			startSystemId: 'S001',
			endSystemId: 'S003',
			status: 'caution'
		});

		expect(emitted[0].id).toBeTruthy();

		expect(form.getRawValue()).toEqual({
			targetSystemId: '',
			status: 'normal'
		});
	});

	it('should update a jump link target', () => {
		const emitted: JumpLink[] = [];

		component.jumpLinkChanged.subscribe((value) => emitted.push(value));

		(component as any).updateJumpLinkTarget(jumpLinks[0], 'S003');

		expect(emitted[0]).toEqual({
			...jumpLinks[0],
			startSystemId: 'S001',
			endSystemId: 'S003'
		});
	});

	it('should update a jump link status', () => {
		const emitted: JumpLink[] = [];

		component.jumpLinkChanged.subscribe((value) => emitted.push(value));

		(component as any).updateJumpLinkStatus(jumpLinks[0], 'dangerous');

		expect(emitted[0]).toEqual({
			...jumpLinks[0],
			status: 'dangerous'
		});
	});

	it('should keep the current target available when editing a jump link', () => {
		const targets = (component as any).availableTargetsFor(jumpLinks[0]);

		expect(targets.map((system: StarSystem) => system.id)).toEqual(['S002', 'S003']);
	});

	it('should sort available jump target options by label', () => {
		fixture.componentRef.setInput('systems', [
			systems[0],
			{
				...systems[2],
				id: 'S003',
				name: 'Zulu'
			},
			{
				...systems[2],
				id: 'S004',
				name: 'Alpha'
			}
		]);

		fixture.componentRef.setInput('jumpLinks', []);

		fixture.detectChanges();

		const options = (component as any).availableJumpTargetOptions();

		expect(options.map((option: any) => option.label)).toEqual(['Alpha', 'Zulu']);
	});

	it('should exclude targets already connected by another jump link', () => {
		const links: JumpLink[] = [
			jumpLinks[0],
			{
				id: 'J002',
				startSystemId: 'S001',
				endSystemId: 'S003',
				status: 'normal'
			}
		];

		fixture.componentRef.setInput('jumpLinks', links);
		fixture.detectChanges();

		const targets = (component as any).availableTargetsFor(jumpLinks[0]);

		expect(targets.map((system: StarSystem) => system.id)).toEqual(['S002']);
	});
});
