/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, signal } from '@angular/core';
import type { ServerToClient } from '@application-platform/protocol';
import type { Direction } from '@application-platform/z21-shared';

/**
 * Z21 UI state store
 */
@Injectable({ providedIn: 'root' })
export class Z21UiStore {
	// UI state
	public powerOn = signal(false);

	// loco state (für aktuell ausgewählte addr)
	public selectedAddr = signal(1845);
	public draggingSpeed = signal(false);

	public speedUi = signal(0); // 0..1
	public dir = signal<Direction>('FWD');
	public functions = signal<Record<number, boolean>>({});

	// optional: turnout etc.
	public turnoutAddr = signal(12);

	/**
	 *
	 */
	public updateFromServer(msg: ServerToClient): void {
		switch (msg.type) {
			case 'system.message.trackpower':
				this.powerOn.set(msg.on);
				break;

			case 'loco.message.state':
				if (msg.addr === this.selectedAddr()) {
					if (this.draggingSpeed()) return;
					this.speedUi.set(this.step128ToUiSpeed(msg.speed));
					this.dir.set(msg.dir);
					this.functions.set(msg.fns);
				}
				break;

			case 'switching.message.turnout.state':
				// no-op for now
				break;

			default:
				break;
		}
	}

	// exakt wie vorher (oder wo du’s hattest)

	/**
	 * Convert UI speed (0..1) to step128 (0..126)
	 */
	private step128ToUiSpeed(step: number): number {
		// bei dir: 0..126 (oder 0..127) -> 0..1
		return Math.max(0, Math.min(1, step / 126));
	}
}
