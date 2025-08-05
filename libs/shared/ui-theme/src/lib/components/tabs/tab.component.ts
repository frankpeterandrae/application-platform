import { Component, input } from '@angular/core';

/**
 *
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
