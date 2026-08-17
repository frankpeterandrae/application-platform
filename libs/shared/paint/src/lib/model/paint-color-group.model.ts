/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Available color groups used to classify paints.
 */
export const PaintColorGroup = {
	Red: 'red',
	Blue: 'blue',
	Yellow: 'yellow',
	Ivory: 'ivory',

	Green: 'green',
	Purple: 'purple',
	Brown: 'brown',

	BlackToWhite: 'black-to-white',
	Metallic: 'metallic',
	Orange: 'orange',
	Pink: 'pink',

	Skintones: 'skintones',
	Technical: 'technical',
	Glaze: 'glaze',
	Inks: 'inks',
	Washes: 'washes'
} as const;

/**
 * Valid paint color group identifier.
 */
export type PaintColorGroup = (typeof PaintColorGroup)[keyof typeof PaintColorGroup];

/**
 * Describes a paint color group.
 */
export interface PaintColorGroupDefinition {
	readonly id: PaintColorGroup;
	readonly label: string;
	readonly color: `#${string}`;
	readonly value: PaintColorGroup;
}

/**
 * Available paint color groups.
 */
export const paintColorGroups: readonly PaintColorGroupDefinition[] = [
	{ id: PaintColorGroup.Red, label: 'Rot', color: '#d32f2f', value: PaintColorGroup.Red },
	{ id: PaintColorGroup.Yellow, label: 'Gelb', color: '#fbc02d', value: PaintColorGroup.Yellow },
	{ id: PaintColorGroup.Orange, label: 'Orange', color: '#f57c00', value: PaintColorGroup.Orange },
	{ id: PaintColorGroup.Green, label: 'Grün', color: '#388e3c', value: PaintColorGroup.Green },

	{ id: PaintColorGroup.Blue, label: 'Blau', color: '#1976d2', value: PaintColorGroup.Blue },
	{ id: PaintColorGroup.Ivory, label: 'Elfenbein', color: '#fffff0', value: PaintColorGroup.Ivory },

	{ id: PaintColorGroup.Purple, label: 'Violett', color: '#7b1fa2', value: PaintColorGroup.Purple },
	{ id: PaintColorGroup.Brown, label: 'Braun', color: '#795548', value: PaintColorGroup.Brown },
	{ id: PaintColorGroup.BlackToWhite, label: 'Schwarz–Weiß', color: '#808080', value: PaintColorGroup.BlackToWhite },

	{ id: PaintColorGroup.Metallic, label: 'Metallic', color: '#9e9e9e', value: PaintColorGroup.Metallic },
	{ id: PaintColorGroup.Pink, label: 'Pink', color: '#c2185b', value: PaintColorGroup.Pink },
	{ id: PaintColorGroup.Skintones, label: 'Hauttöne', color: '#d7a67b', value: PaintColorGroup.Skintones },

	{ id: PaintColorGroup.Technical, label: 'Technisch', color: '#607d8b', value: PaintColorGroup.Technical },
	{ id: PaintColorGroup.Glaze, label: 'Glaze', color: '#8e6f9e', value: PaintColorGroup.Glaze },
	{ id: PaintColorGroup.Inks, label: 'Inks', color: '#455a64', value: PaintColorGroup.Inks },
	{ id: PaintColorGroup.Washes, label: 'Washes', color: '#5d4037', value: PaintColorGroup.Washes }
];
