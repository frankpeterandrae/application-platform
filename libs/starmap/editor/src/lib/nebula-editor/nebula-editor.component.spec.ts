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
		points: [
			{ x: 0, y: 0, z: 0 },
			{ x: 1, y: 0, z: 0 },
			{ x: 0, y: 1, z: 0 }
		]
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
			points: [
				{ x: 0, y: 0, z: 0 },
				{ x: 1, y: 0, z: 0 },
				{ x: 0, y: 1, z: 0 }
			]
		});
	});

	it('should update the form when the nebula input changes', () => {
		const updated: Nebula = {
			...nebula,
			id: 'N002',
			name: 'Updated Nebula',
			style: 'haze',
			opacity: 0.75,
			points: [
				{ x: 1, y: 1, z: 0 },
				{ x: 2, y: 1, z: 0 },
				{ x: 1, y: 2, z: 0 },
				{ x: 2, y: 2, z: 0 }
			]
		};

		fixture.componentRef.setInput('nebula', updated);

		fixture.detectChanges();

		const form = (component as any).form;

		expect(form.controls.name.value).toBe('Updated Nebula');

		expect(form.controls.style.value).toBe('haze');

		expect(form.controls.points).toHaveLength(4);
	});

	it('should add a point', () => {
		const points = (component as any).points;

		(component as any).addPoint();

		expect(points).toHaveLength(4);

		expect(points.at(3).getRawValue()).toEqual({
			x: 0,
			y: 0,
			z: 0
		});
	});

	it('should not remove a point when only three points remain', () => {
		const points = (component as any).points;

		(component as any).removePoint(0);

		expect(points).toHaveLength(3);
	});

	it('should remove a point when more than three points exist', () => {
		const points = (component as any).points;

		(component as any).addPoint();

		expect(points).toHaveLength(4);

		(component as any).removePoint(0);

		expect(points).toHaveLength(3);

		expect(points.at(0).getRawValue()).toEqual({
			x: 1,
			y: 0,
			z: 0
		});
	});

	it('should not save an invalid form', () => {
		const emitted: Nebula[] = [];

		component.nebulaChanged.subscribe((value) => emitted.push(value));

		(component as any).form.controls.name.setValue('');

		(component as any).save();

		expect(emitted).toHaveLength(0);
	});

	it('should not save with fewer than three points', () => {
		const emitted: Nebula[] = [];

		component.nebulaChanged.subscribe((value) => emitted.push(value));

		const points = (component as any).points;

		points.removeAt(0);

		(component as any).save();

		expect(emitted).toHaveLength(0);
	});

	it('should emit the changed nebula when saving', () => {
		const emitted: Nebula[] = [];

		component.nebulaChanged.subscribe((value) => emitted.push(value));

		const form = (component as any).form;

		form.controls.name.setValue('Changed Nebula');

		form.controls.style.setValue('outline');

		form.controls.opacity.setValue(0.8);

		(component as any).save();

		expect(emitted).toEqual([
			{
				id: 'N001',
				name: 'Changed Nebula',
				style: 'outline',
				color: '#123456',
				opacity: 0.8,
				points: [
					{ x: 0, y: 0, z: 0 },
					{ x: 1, y: 0, z: 0 },
					{ x: 0, y: 1, z: 0 }
				]
			}
		]);
	});

	it('should emit the nebula id when deleting', () => {
		const emitted: string[] = [];

		component.nebulaDeleted.subscribe((value) => emitted.push(value));

		component.nebulaDeleted.emit(component.nebula().id);

		expect(emitted).toEqual(['N001']);
	});

	it('should create a nebula form with existing points', () => {
		const form = (component as any).createNebulaForm(nebula);

		expect(form.controls.points).toHaveLength(3);
		expect(form.controls.points.at(1).getRawValue()).toEqual({
			x: 1,
			y: 0,
			z: 0
		});
	});
});
