/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	ButtonColorDefinition,
	ButtonComponent,
	IconDefinition,
	InputComponent,
	SelectComponent,
	SelectOption
} from '@application-platform/shared/ui-theme';
import {
	JUMP_LINK_TYPES,
	JumpLink,
	JumpLinkStatus,
	PLANET_TYPES,
	PlanetType,
	randomSpectralType,
	StarSystem
} from '@application-platform/starmap-domain';

type PlanetForm = FormGroup<{
	id: FormControl<string>;
	name: FormControl<string>;
	type: FormControl<PlanetType>;
	classification: FormControl<string>;
}>;

/**
 * The SystemEditorComponent is responsible for displaying and editing the details of a selected star system.
 */
@Component({
	selector: 'starmap-editor-system-editor',
	imports: [FormsModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
	templateUrl: './system-editor.component.html',
	styleUrl: './system-editor.component.scss'
})
export class SystemEditorComponent {
	private readonly formBuilder = inject(FormBuilder);
	protected readonly ButtonColorDefinition = ButtonColorDefinition;

	public readonly system = input.required<StarSystem>();
	public readonly systemSaved = output<StarSystem>();
	public readonly systemDeleted = output<string>();

	public readonly systems = input.required<StarSystem[]>();
	public readonly jumpLinks = input.required<JumpLink[]>();

	public readonly jumpLinkCreated = output<JumpLink>();
	public readonly jumpLinkChanged = output<JumpLink>();
	public readonly jumpLinkDeleted = output<string>();

	protected readonly planetTypeOptions: SelectOption<PlanetType>[] = PLANET_TYPES.map((type) => ({
		label: type.label,
		value: type.value
	}));

	protected readonly statusOptions: SelectOption<JumpLinkStatus>[] = JUMP_LINK_TYPES.map((type) => ({
		label: type.label,
		value: type.value
	}));

	protected readonly availableJumpTargetOptions = computed<SelectOption<string>[]>(() =>
		this.availableJumpTargets()
			.map((system) => ({
				label: system.name,
				value: system.id
			}))
			.sort((a, b) => a.label.localeCompare(b.label))
	);

	protected availableTargetOptionsFor(link: JumpLink): SelectOption<string>[] {
		return this.availableTargetsFor(link)
			.map((system) => ({
				label: system.name,
				value: system.id
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}

	protected readonly form = this.formBuilder.nonNullable.group({
		name: ['', Validators.required],
		faction: [''],
		x: [0, Validators.required],
		y: [0, Validators.required],
		z: [0, Validators.required],
		stars: this.formBuilder.array<FormControl<string>>([]),
		planets: this.formBuilder.array<PlanetForm>([])
	});

	protected readonly systemJumpLinks = computed(() => {
		const systemId = this.system().id;

		return this.jumpLinks().filter((link) => link.startSystemId === systemId || link.endSystemId === systemId);
	});

	protected readonly availableJumpTargets = computed(() => {
		const currentSystemId = this.system().id;

		const connectedIds = new Set(this.systemJumpLinks().map((link) => this.otherSystemId(link)));

		return this.systems().filter((system) => system.id !== currentSystemId && !connectedIds.has(system.id));
	});

	protected get stars(): FormArray<FormControl<string>> {
		return this.form.controls.stars;
	}

	protected get planets(): FormArray<PlanetForm> {
		return this.form.controls.planets;
	}

	constructor() {
		effect(() => {
			const system = this.system();

			this.form.patchValue(
				{
					name: system.name,
					faction: system.faction ?? '',
					x: system.position.x,
					y: system.position.y,
					z: system.position.z
				},
				{ emitEvent: false }
			);

			this.form.setControl(
				'stars',
				this.formBuilder.array<FormControl<string>>(
					system.stars.map((star) => this.formBuilder.nonNullable.control(star.spectralType))
				)
			);

			this.form.setControl(
				'planets',
				this.formBuilder.array<PlanetForm>(system.planets.map((planet) => this.createPlanetForm(planet)))
			);
		});
	}

	protected save(): void {
		if (this.form.invalid) {
			return;
		}

		const system = this.system();
		const value = this.form.getRawValue();

		this.systemSaved.emit({
			...system,
			name: value.name,
			faction: value.faction || undefined,
			position: {
				x: Number(value.x),
				y: Number(value.y),
				z: Number(value.z)
			},
			stars: value.stars.map((spectralType) => ({
				spectralType
			})),
			planets: value.planets
		});
	}

	protected addStar(): void {
		this.stars.push(this.formBuilder.nonNullable.control(randomSpectralType()));
	}

	protected removeStar(index: number): void {
		this.stars.removeAt(index);
	}

	protected addPlanet(): void {
		this.planets.push(this.createPlanetForm());
	}

	protected removePlanet(index: number): void {
		this.planets.removeAt(index);
	}

	private createPlanetForm(planet?: { id: string; name: string; type: PlanetType; classification: string }): PlanetForm {
		return this.formBuilder.nonNullable.group({
			id: [planet?.id ?? crypto.randomUUID()],
			name: [planet?.name ?? '', Validators.required],
			type: [planet?.type ?? 'other'],
			classification: [planet?.classification ?? '']
		});
	}

	protected otherSystemId(link: JumpLink): string {
		return link.startSystemId === this.system().id ? link.endSystemId : link.startSystemId;
	}

	protected systemName(systemId: string): string {
		return this.systems().find((system) => system.id === systemId)?.name ?? systemId;
	}

	protected readonly jumpLinkForm = this.formBuilder.nonNullable.group({
		targetSystemId: ['', Validators.required],
		status: ['normal' as JumpLinkStatus, Validators.required]
	});

	protected addJumpLink(): void {
		if (this.jumpLinkForm.invalid) {
			return;
		}

		const value = this.jumpLinkForm.getRawValue();

		this.jumpLinkCreated.emit({
			id: crypto.randomUUID(),
			startSystemId: this.system().id,
			endSystemId: value.targetSystemId,
			status: value.status
		});

		this.jumpLinkForm.reset({
			targetSystemId: '',
			status: 'normal'
		});
	}

	protected updateJumpLinkTarget(link: JumpLink, targetSystemId: string): void {
		this.jumpLinkChanged.emit({
			...link,
			startSystemId: this.system().id,
			endSystemId: targetSystemId
		});
	}

	protected updateJumpLinkStatus(link: JumpLink, status: JumpLinkStatus): void {
		this.jumpLinkChanged.emit({
			...link,
			status
		});
	}

	protected randomizeStar(index: number): void {
		this.stars.at(index).setValue(randomSpectralType());
	}

	protected availableTargetsFor(link: JumpLink): StarSystem[] {
		const currentSystemId = this.system().id;
		const currentTargetId = this.otherSystemId(link);

		const connectedIds = new Set(
			this.systemJumpLinks()
				.filter((existingLink) => existingLink.id !== link.id)
				.map((existingLink) => this.otherSystemId(existingLink))
		);

		return this.systems().filter(
			(system) => system.id !== currentSystemId && (system.id === currentTargetId || !connectedIds.has(system.id))
		);
	}

	protected readonly IconDefinition = IconDefinition;
}
