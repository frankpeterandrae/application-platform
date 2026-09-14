/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Nebula } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { NebulaEditorComponent } from './nebula-editor.component';

describe('NebulaEditorComponent', () => {
	let component: NebulaEditorComponent;
	let fixture: ComponentFixture<NebulaEditorComponent>;

	const nebula: Nebula = {
		id: 'N001',
		name: 'Orion Nebula',
		style: 'cloud',
		color: '#123456',
		opacity: 0.5,
		nodes: [
			{
				id: 'node-1',
				position: {
					x: -15,
					y: 0,
					z: 0
				},
				radius: 1
			},
			{
				id: 'node-2',
				position: {
					x: 0,
					y: 18,
					z: 0
				},
				radius: 1
			},
			{
				id: 'node-3',
				position: {
					x: 1,
					y: 1,
					z: 20
				},
				radius: 1
			}
		],
		connections: []
	};

	beforeEach(async () => {
		await setupTestingModule({
			imports: [NebulaEditorComponent]
		});

		fixture = TestBed.createComponent(NebulaEditorComponent);

		component = fixture.componentInstance;

		fixture.componentRef.setInput('nebula', nebula);

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize the form from the nebula input', () => {
		const form = (component as any).form;

		expect(form.getRawValue()).toEqual({
			id: 'N001',
			name: 'Orion Nebula',
			style: 'cloud',
			color: '#123456',
			opacity: 0.5,
			nodes: [
				{
					id: 'node-1',
					x: -15,
					y: 0,
					z: 0,
					radius: 1
				},
				{
					id: 'node-2',
					x: 0,
					y: 18,
					z: 0,
					radius: 1
				},
				{
					id: 'node-3',
					x: 1,
					y: 1,
					z: 20,
					radius: 1
				}
			],
			connections: []
		});
	});

	it('should update the form when the nebula input changes', () => {
		const updated: Nebula = {
			...nebula,
			id: 'N002',
			name: 'Updated Nebula',
			style: 'haze',
			opacity: 0.75,

			nodes: [
				{
					id: 'node-1',
					position: {
						x: -15,
						y: 0,
						z: 0
					},
					radius: 1
				},
				{
					id: 'node-2',
					position: {
						x: 0,
						y: 18,
						z: 0
					},
					radius: 1
				},
				{
					id: 'node-3',
					position: {
						x: 1,
						y: 1,
						z: 20
					},
					radius: 1
				}
			],
			connections: []
		};

		fixture.componentRef.setInput('nebula', updated);

		fixture.detectChanges();

		const form = (component as any).form;

		expect(form.controls.name.value).toBe('Updated Nebula');

		expect(form.controls.style.value).toBe('haze');

		expect(form.controls.nodes).toHaveLength(3);
	});

	it('should add a node', () => {
		const nodes = (component as any).nodes;

		(component as any).addNode();

		expect(nodes).toHaveLength(4);

		expect(nodes.at(3).getRawValue()).toMatchObject({
			x: 0,
			y: 0,
			z: 0,
			radius: 2
		});
	});

	it('should remove a node', () => {
		const nodes = (component as any).nodes;

		(component as any).removeNode(0);

		expect(nodes).toHaveLength(2);
	});

	it('should remove connections of a removed node', () => {
		const nodes = (component as any).nodes;
		const connections = (component as any).connections;

		connections.push(
			(component as any).createConnectionForm({
				from: 'node-1',
				to: 'node-2'
			})
		);

		(component as any).removeNode(0);

		expect(nodes).toHaveLength(2);
		expect(connections).toHaveLength(0);
	});

	it('should add a connection between the first two nodes', () => {
		const connections = (component as any).connections;

		(component as any).addConnection();

		expect(connections).toHaveLength(1);

		expect(connections.at(0).getRawValue()).toEqual({
			from: 'node-1',
			to: 'node-2'
		});
	});

	it('should not save an invalid form', () => {
		const emitted: Nebula[] = [];

		component.nebulaChanged.subscribe((value) => emitted.push(value));

		(component as any).form.controls.name.setValue('');

		expect(emitted).toHaveLength(0);
	});

	it('should not save without nodes', () => {
		const emitted: Nebula[] = [];

		component.nebulaChanged.subscribe((value) => emitted.push(value));

		const nodes = (component as any).nodes;

		while (nodes.length > 0) {
			nodes.removeAt(0);
		}

		(component as any).saveNebula();

		expect(emitted).toHaveLength(0);
	});

	it('should emit the changed nebula when saving', () => {
		const emitted: Nebula[] = [];

		component.nebulaChanged.subscribe((value) => emitted.push(value));

		const form = (component as any).form;

		form.controls.name.setValue('Changed Nebula');
		form.controls.style.setValue('outline');
		form.controls.opacity.setValue(0.8);

		(component as any).saveNebula();

		expect(emitted.at(-1)).toEqual({
			id: 'N001',
			name: 'Changed Nebula',
			style: 'outline',
			color: '#123456',
			opacity: 0.8,
			nodes: [
				{
					id: 'node-1',
					position: {
						x: -15,
						y: 0,
						z: 0
					},
					radius: 1
				},
				{
					id: 'node-2',
					position: {
						x: 0,
						y: 18,
						z: 0
					},
					radius: 1
				},
				{
					id: 'node-3',
					position: {
						x: 1,
						y: 1,
						z: 20
					},
					radius: 1
				}
			],
			connections: []
		});
	});

	it('should emit the nebula id when deleting', () => {
		const emitted: string[] = [];

		component.nebulaDeleted.subscribe((value) => emitted.push(value));

		component.nebulaDeleted.emit(component.nebula().id);

		expect(emitted).toEqual(['N001']);
	});

	it('should create a nebula form with existing nodes', () => {
		const form = (component as any).createNebulaForm(nebula);

		expect(form.controls.nodes).toHaveLength(3);

		expect(form.controls.nodes.at(1).getRawValue()).toEqual({
			id: 'node-2',
			x: 0,
			y: 18,
			z: 0,
			radius: 1
		});

		expect(form.controls.connections).toHaveLength(0);
	});
});
