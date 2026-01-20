/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { KeyValuePipe, type KeyValue } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import type { ServerToClient } from '@application-platform/protocol';
import { TurnoutState } from '@application-platform/z21-shared';

import { WsClientService } from './ws-client.service';
import { Z21UiStore } from './z21-ui-store.service';

/**
 * Root application component for the z21 UI.
 *
 * Responsibilities:
 * - Hold UI state as signals (status, last received message, controls).
 * - Manage the WebSocket connection to the platform server.
 * - Provide public methods used by the template (setSpeed, sendFn, sendTurnout).
 *
 * Notes:
 * - Signals are used for lightweight reactive state (Angular signals API).
 * - Messages sent/received conform to the `ClientToServer` / `ServerToClient` protocol.
 */
@Component({
	selector: 'z21-app-root',
	imports: [KeyValuePipe],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	public cvAddress = signal(29);
	public cvValue = signal<number | null>(null);
	public cvError = signal<string | null>(null);

	protected numericKeySort = (a: KeyValue<string, unknown>, b: KeyValue<string, unknown>): number => {
		const na = Number(a.key);
		const nb = Number(b.key);
		if (isNaN(na) && isNaN(nb)) return 0;
		if (isNaN(na)) return -1;
		if (isNaN(nb)) return 1;
		return na - nb;
	};

	public ws = inject(WsClientService);
	public store = inject(Z21UiStore);

	/**
	 *
	 */
	constructor() {
		this.ws.onMessage((msg) => this.store.updateFromServer(msg));
	}

	/**
	 *
	 */
	public setSpeed(v: number): void {
		const step = this.uiSpeedToStep128(v);
		this.store.speedUi.set(v);
		this.ws.send({ type: 'loco.command.drive', addr: this.store.selectedAddr(), speed: step, dir: this.store.dir(), steps: 128 });
	}

	/**
	 *
	 */
	public sendFn(fn: number, on: boolean): void {
		this.ws.send({ type: 'loco.command.function.set', addr: this.store.selectedAddr(), fn, on });
	}

	/**
	 *
	 */
	public sendTurnout(state: TurnoutState): void {
		this.ws.send({ type: 'switching.command.turnout.set', addr: this.store.turnoutAddr(), state, pulseMs: 200 });
	}

	/**
	 *
	 */
	public sendEStop(): void {
		this.ws.send({ type: 'loco.command.eStop', addr: this.store.selectedAddr() });
	}

	/**
	 *
	 */
	public sendCVRead(): void {
		this.ws.send({ type: 'programming.command.cv.read', payload: { cvAdress: 1, requestId: 'ui-req-1' } });
	}

	/**
	 *
	 */
	private clamp01(x: number): number {
		return Math.max(0, Math.min(1, x));
	}

	/**
	 *
	 */
	private uiSpeedToStep128(ui: number): number {
		// 0..1 -> 0..126
		return Math.round(this.clamp01(ui) * 126);
	}

	/**
	 *
	 */
	public togglePower(): void {
		if (this.store.powerOn()) {
			this.store.powerOn.set(false);
			this.ws.send({ type: 'system.command.trackpower.set', on: false });
		} else {
			this.store.powerOn.set(true);
			this.ws.send({ type: 'system.command.trackpower.set', on: true });
		}
	}

	// NEW: CV read (Request/Response)
	/**
	 *
	 */
	public async readCv(): Promise<void> {
		this.cvError.set(null);
		this.cvValue.set(null);

		try {
			const res = await this.ws.request<Extract<ServerToClient, { type: 'programming.replay.cv.result' }>>(
				(requestId) => ({
					type: 'programming.command.cv.read',

					payload: { requestId, cvAdress: this.cvAddress() }
				}),
				{ timeoutMs: 8000 }
			);

			this.cvValue.set(res.payload.cvValue);
		} catch (e) {
			this.cvError.set((e as Error).message);
		}
	}

	// NEW: CV write (Request/Response)
	/**
	 *
	 */
	public async writeCv(): Promise<void> {
		this.cvError.set(null);

		const value = this.cvValue();
		if (value === null) {
			this.cvError.set('cvValue is null');
			return;
		}

		try {
			await this.ws.request<Extract<ServerToClient, { type: 'programming.replay.cv.result' }>>(
				(requestId) => ({
					type: 'programming.command.cv.write',
					payload: { requestId, cvAdress: this.cvAddress(), cvValue: value }
				}),
				{ timeoutMs: 8000 }
			);
		} catch (e) {
			this.cvError.set((e as Error).message);
		}
	}

	/**
	 *
	 */
	private step128ToUiSpeed(step: number): number {
		// 0..126 -> 0..1
		if (step <= 0) return 0;
		if (step >= 126) return 1;
		return step / 126;
	}

	protected readonly TurnoutState = TurnoutState;

	/**
	 *
	 */
	public setLocoNumber(number: number): void {
		this.store.selectedAddr.set(number);
	}

	/**
	 *
	 */
	public draggingSpeed(dragging: boolean): void {
		this.store.draggingSpeed.set(dragging);
	}
}
