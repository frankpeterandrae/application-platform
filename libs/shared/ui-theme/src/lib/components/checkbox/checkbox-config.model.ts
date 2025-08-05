/*
 * Copyright (c) 2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { CheckboxColorDefinition } from '../../enums';

export interface CheckboxConfig {
	label: string;
	id: string;
	value: string;
	color?: CheckboxColorDefinition;
	disabled?: boolean;
	checked?: boolean;
	required?: boolean;
	onInput?: (value: Event) => void;
}
