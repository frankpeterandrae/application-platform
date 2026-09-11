/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, effect, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	ButtonColorDefinition,
	ButtonComponent,
	IconDefinition,
	InputComponent,
	SelectComponent,
	SelectOption
} from '@application-platform/shared/ui-theme';
import { Nebula, NebulaType, Position3d } from '@application-platform/starmap-domain';

type NebulaPointForm = FormGroup<{
	x: FormControl<number>;
	y: FormControl<number>;
	z: FormControl<number>;
}>;

type NebulaForm = FormGroup<{
	id: FormControl<string>;
	name: FormControl<string>;
	style: FormControl<NebulaType>;
	color: FormControl<`#${string}`>;
	opacity: FormControl<number>;
	points: FormArray<NebulaPointForm>;
}>;

/**
 * Displays and edits the properties and boundary points of a selected nebula.
 */
@Component({
	selector: 'starmap-editor-nebula-editor',
	imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
	templateUrl: './nebula-editor.component.html',
	styleUrl: './nebula-editor.component.scss'
})
export class NebulaEditorComponent {
	protected readonly ButtonColorDefinition = ButtonColorDefinition;

	private readonly formBuilder = inject(FormBuilder);
	public readonly nebula = input.required<Nebula>();

	public readonly nebulaChanged = output<Nebula>();
	public readonly nebulaDeleted = output<string>();

	protected readonly form = this.createNebulaForm();

	protected readonly styleOptions: SelectOption<NebulaType>[] = [
		{
			label: 'Warpsorm',
			value: 'cloud'
		},
		{
			label: 'Region',
			value: 'outline'
		},
		{
			label: 'Wolke',
			value: 'haze'
		}
	];

	protected get points(): FormArray<NebulaPointForm> {
		return this.form.controls.points;
	}

	constructor() {
		effect(() => {
			const nebula = this.nebula();

			this.form.controls.id.setValue(nebula.id);
			this.form.controls.name.setValue(nebula.name);
			this.form.controls.style.setValue(nebula.style);
			this.form.controls.color.setValue(nebula.color);
			this.form.controls.opacity.setValue(nebula.opacity);

			this.form.setControl('points', this.formBuilder.array(nebula.points.map((point) => this.createPointForm(point))));
		});
	}

	private createNebulaForm(nebula?: Nebula): NebulaForm {
		return this.formBuilder.nonNullable.group({
			id: [nebula?.id ?? crypto.randomUUID()],
			name: [nebula?.name ?? 'Neuer Nebel', Validators.required],
			style: [nebula?.style ?? 'cloud'],
			color: [nebula?.color ?? '#7a2f8f'],
			opacity: [nebula?.opacity ?? 0.35, [Validators.required, Validators.min(0), Validators.max(1)]],
			points: this.formBuilder.array<NebulaPointForm>(nebula?.points.map((point) => this.createPointForm(point)) ?? [])
		});
	}

	private createPointForm(point?: Position3d): NebulaPointForm {
		return this.formBuilder.nonNullable.group({
			x: [point?.x ?? 0],
			y: [point?.y ?? 0],
			z: [point?.z ?? 0]
		});
	}

	protected addPoint(): void {
		this.points.push(this.createPointForm());
	}

	protected removePoint(index: number): void {
		if (this.points.length <= 3) {
			return;
		}

		this.points.removeAt(index);
	}

	protected save(): void {
		if (this.form.invalid || this.points.length < 3) {
			return;
		}

		const value = this.form.getRawValue();

		this.nebulaChanged.emit({
			id: value.id,
			name: value.name,
			style: value.style,
			color: value.color,
			opacity: Number(value.opacity),
			points: value.points.map((point) => ({
				x: Number(point.x),
				y: Number(point.y),
				z: Number(point.z)
			}))
		});
	}

	protected readonly IconDefinition = IconDefinition;
}
