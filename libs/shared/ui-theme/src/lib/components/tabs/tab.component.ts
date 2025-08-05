/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input } from '@angular/core';

/**
 * TabComponent represents a single tab within a tabbed interface.
 */
@Component({
	selector: 'theme-tab',
	imports: [],
	templateUrl: './tab.component.html'
})
export class TabComponent {
	/** Tab label shown in the tab header. */
	public label = input.required<string>();

	/** Whether this tab is currently active. */
	public active = false;
}
