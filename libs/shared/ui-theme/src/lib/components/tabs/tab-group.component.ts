import { Component, AfterContentInit, contentChildren } from '@angular/core';

import { TabComponent } from './tab.component';
import { CardComponent } from '../card/card.component';

/**
 * TabGroupComponent manages a set of TabComponents and displays tabs.
 */
@Component({
	selector: 'theme-tab-group',
	imports: [CardComponent],
	templateUrl: './tab-group.component.html'
})
export class TabGroupComponent implements AfterContentInit {
	/** Finds all TabComponent children in this group. */
	public readonly tabs = contentChildren(TabComponent);

	/**
	 * Lifecycle hook called after tab content has been initialized.
	 */
	public ngAfterContentInit(): void {
		// Activate first tab if none are active
		const activeTabs = this.tabs().filter((tab) => tab.active);
		const allTaps = this.tabs();
		if (!activeTabs.length && allTaps[0]) {
			this.selectTab(allTaps[0]);
		}
	}

	/**
	 * Selects a tab and deactivates all others.
	 * @param { TabComponent } tab - The tab component to activate.
	 */
	public selectTab(tab: TabComponent): void {
		this.tabs().forEach((t) => (t.active = false));
		tab.active = true;
	}
}
