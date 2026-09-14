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
import { Nebula, NebulaConnection, NebulaNode, NebulaType } from '@application-platform/starmap-domain';

type NebulaNodeForm = FormGroup<{
	id: FormControl<string>;
	x: FormControl<number>;
	y: FormControl<number>;
	z: FormControl<number>;
	radius: FormControl<number>;
}>;

type NebulaConnectionForm = FormGroup<{
	from: FormControl<string>;
	to: FormControl<string>;
}>;

type NebulaForm = FormGroup<{
	id: FormControl<string>;
	name: FormControl<string>;
	style: FormControl<NebulaType>;
	color: FormControl<`#${string}`>;
	opacity: FormControl<number>;
	nodes: FormArray<NebulaNodeForm>;
	connections: FormArray<NebulaConnectionForm>;
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
	protected readonly IconDefinition = IconDefinition;

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

	protected get nodes(): FormArray<NebulaNodeForm> {
		return this.form.controls.nodes;
	}

	protected get connections(): FormArray<NebulaConnectionForm> {
		return this.form.controls.connections;
	}

	protected get nodeOptions(): SelectOption<string>[] {
		return this.nodes.controls.map((node, index) => ({
			label: `Punkt ${index + 1}`,
			value: node.controls.id.value
		}));
	}

	constructor() {
		effect(() => {
			const nebula = this.nebula();

			this.form.controls.id.setValue(nebula.id);
			this.form.controls.name.setValue(nebula.name);
			this.form.controls.style.setValue(nebula.style);
			this.form.controls.color.setValue(nebula.color);
			this.form.controls.opacity.setValue(nebula.opacity);

			this.form.setControl('nodes', this.formBuilder.array(nebula.nodes.map((node) => this.createNodeForm(node))));

			this.form.setControl(
				'connections',
				this.formBuilder.array(nebula.connections.map((connection) => this.createConnectionForm(connection)))
			);
		});
	}

	private createNebulaForm(nebula?: Nebula): NebulaForm {
		return this.formBuilder.nonNullable.group({
			id: [nebula?.id ?? crypto.randomUUID()],
			name: [nebula?.name ?? 'Neuer Nebel', Validators.required],
			style: [nebula?.style ?? 'cloud'],
			color: [nebula?.color ?? '#7a2f8f'],
			opacity: [nebula?.opacity ?? 0.35, [Validators.required, Validators.min(0), Validators.max(1)]],
			nodes: this.formBuilder.array<NebulaNodeForm>(nebula?.nodes.map((node) => this.createNodeForm(node)) ?? []),
			connections: this.formBuilder.array<NebulaConnectionForm>(
				nebula?.connections.map((connection) => this.createConnectionForm(connection)) ?? []
			)
		});
	}

	private createNodeForm(node?: NebulaNode): NebulaNodeForm {
		return this.formBuilder.nonNullable.group({
			id: [node?.id ?? crypto.randomUUID()],
			x: [node?.position.x ?? 0],
			y: [node?.position.y ?? 0],
			z: [node?.position.z ?? 0],
			radius: [node?.radius ?? 2, [Validators.required, Validators.min(0.1)]]
		});
	}

	private createConnectionForm(connection?: NebulaConnection): NebulaConnectionForm {
		return this.formBuilder.nonNullable.group({
			from: [connection?.from ?? ''],
			to: [connection?.to ?? '']
		});
	}

	protected addNode(): void {
		this.nodes.push(this.createNodeForm());
	}

	protected removeNode(index: number): void {
		const nodeId = this.nodes.at(index).controls.id.value;

		this.nodes.removeAt(index);

		for (let connectionIndex = this.connections.length - 1; connectionIndex >= 0; connectionIndex--) {
			const connection = this.connections.at(connectionIndex).getRawValue();

			if (connection.from === nodeId || connection.to === nodeId) {
				this.connections.removeAt(connectionIndex);
			}
		}
	}

	protected addConnection(): void {
		if (this.nodes.length < 2) {
			return;
		}

		this.connections.push(
			this.createConnectionForm({
				from: this.nodes.at(0).controls.id.value,
				to: this.nodes.at(1).controls.id.value
			})
		);
	}

	protected removeConnection(index: number): void {
		this.connections.removeAt(index);
	}

	protected saveNebula(): void {
		if (this.form.invalid || this.nodes.length === 0) {
			return;
		}

		const value = this.form.getRawValue();

		this.nebulaChanged.emit({
			id: value.id,
			name: value.name,
			style: value.style,
			color: value.color,
			opacity: Number(value.opacity),

			nodes: value.nodes.map((node) => ({
				id: node.id,
				position: {
					x: Number(node.x),
					y: Number(node.y),
					z: Number(node.z)
				},
				radius: Number(node.radius)
			})),

			connections: value.connections.map((connection) => ({
				from: connection.from,
				to: connection.to
			}))
		});
	}
}
