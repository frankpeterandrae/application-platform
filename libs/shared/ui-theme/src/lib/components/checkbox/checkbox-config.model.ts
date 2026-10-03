/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CheckboxColorDefinition } from '../../enums';

/**
 * Configuration for a checkbox rendered by CheckboxGroupComponent.
 */
export interface CheckboxConfig {
	label: string;
	id: string;
	value: string;
	color?: CheckboxColorDefinition;
	disabled?: boolean;
	checked?: boolean;
	required?: boolean;
}
