/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export class FocusManager {
	#trigger: HTMLElement | null = null;
	public rememberTrigger(trigger: HTMLElement | null): void {
		this.#trigger = trigger;
	}
	public restoreTrigger(): void {
		this.#trigger?.focus({ preventScroll: true });
	}
	public focusFirstAction(container: ParentNode): boolean {
		const first = container.querySelector<HTMLButtonElement>('button:not([disabled])');
		first?.focus({ preventScroll: true });
		return !!first;
	}
}
