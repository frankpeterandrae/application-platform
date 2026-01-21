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
	/**
	 * CV address signal used by CV read/write controls.
	 * @example this.cvAddress() // -> number
	 */
	public cvAddress = signal(29);

	/**
	 * Current CV value signal. `null` when not set.
	 * @example this.cvValue() // -> number | null
	 */
	public cvValue = signal<number | null>(null);

	/**
	 * Error message for CV operations. `null` when no error.
	 */
	public cvError = signal<string | null>(null);

	/**
	 * Sort function used by the template to order key/value maps numerically when possible.
	 * - Returns negative if `a < b`, positive if `a > b`, zero if equal.
	 * - Non-numeric keys are ordered before numeric keys.
	 */
	protected numericKeySort = (a: KeyValue<string, unknown>, b: KeyValue<string, unknown>): number => {
		const na = Number(a.key);
		const nb = Number(b.key);
		if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
		if (Number.isNaN(na)) return -1;
		if (Number.isNaN(nb)) return 1;
		return na - nb;
	};

	/**
	 * WebSocket client service instance (injected).
	 * @readonly
	 */
	public ws = inject(WsClientService);

	/**
	 * Local UI state store for the z21 UI (injected).
	 * @readonly
	 */
	public store = inject(Z21UiStore);

	/**
	 * Set up message handling: route incoming server messages into the local store.
	 *
	 * The constructor registers a message callback that forwards messages to
	 * `Z21UiStore.updateFromServer`.
	 */
	constructor() {
		this.ws.onMessage((msg) => this.store.updateFromServer(msg));
	}

	/**
	 * Send a drive command for the currently selected locomotive.
	 *
	 * Converts a UI speed (0..1) into the 0..126 step used by the protocol,
	 * updates the UI store and sends a `loco.command.drive` message with a generated requestId.
	 *
	 * @param v - UI speed in the range 0..1
	 */
	public setSpeed(v: number): void {
		const step = this.uiSpeedToStep128(v);
		const requestId = crypto.randomUUID();
		this.store.speedUi.set(v);
		this.ws.send({
			type: 'loco.command.drive',
			payload: { addr: this.store.selectedAddr(), speed: step, dir: this.store.dir(), steps: 128, requestId }
		});
	}

	/**
	 * Toggle a function (light/sound/etc.) on a locomotive.
	 *
	 * Sends a `loco.command.function.set` message with the targeted function number and desired state.
	 *
	 * @param fn - Function number to set
	 * @param on - Desired function state (true = on)
	 */
	public sendFn(fn: number, on: boolean): void {
		const requestId = crypto.randomUUID();
		this.ws.send({ type: 'loco.command.function.set', payload: { addr: this.store.selectedAddr(), fn, on, requestId } });
	}

	/**
	 * Set a turnout (switch) to a desired state.
	 *
	 * Sends a `switching.command.turnout.set` with the stored turnout address and pulse duration.
	 *
	 * @param state - Desired `TurnoutState`
	 */
	public sendTurnout(state: TurnoutState): void {
		const requestId = crypto.randomUUID();
		this.ws.send({
			type: 'switching.command.turnout.set',
			payload: { addr: this.store.turnoutAddr(), state, pulseMs: 200, requestId }
		});
	}

	/**
	 * Emergency stop for the selected locomotive.
	 *
	 * Sends a `loco.command.eStop` message for the currently selected address.
	 */
	public sendEStop(): void {
		const requestId = crypto.randomUUID();
		this.ws.send({ type: 'loco.command.eStop', payload: { addr: this.store.selectedAddr(), requestId } });
	}

	/**
	 * Clamp a number into the inclusive range \[0, 1\].
	 *
	 * @param x - Value to clamp
	 * @returns value constrained to 0..1
	 */
	private clamp01(x: number): number {
		return Math.max(0, Math.min(1, x));
	}

	/**
	 * Convert a UI speed (0..1) to the protocol step range 0..126.
	 *
	 * - 0 maps to 0
	 * - 1 maps to 126
	 *
	 * @param ui - UI speed in 0..1
	 * @returns rounded step in 0..126
	 */
	private uiSpeedToStep128(ui: number): number {
		// 0..1 -> 0..126
		return Math.round(this.clamp01(ui) * 126);
	}

	/**
	 * Toggle the track power state.
	 *
	 * Updates the local store and emits a `system.command.trackpower.set` message with the new state.
	 */
	public togglePower(): void {
		const requestId = crypto.randomUUID();
		if (this.store.powerOn()) {
			this.store.powerOn.set(false);
			this.ws.send({ type: 'system.command.trackpower.set', payload: { on: false, requestId } });
		} else {
			this.store.powerOn.set(true);
			this.ws.send({ type: 'system.command.trackpower.set', payload: { on: true, requestId } });
		}
	}

	/**
	 * Read a CV (configuration variable) from the selected address.
	 *
	 * Performs an asynchronous request via `WsClientService.request` and updates
	 * `cvValue` on success or `cvError` on failure.
	 *
	 * @remarks
	 * - Uses an 8000ms timeout for the request.
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

	/**
	 * Write a CV value to the selected address.
	 *
	 * Sends a `programming.command.cv.write` request and reports errors via `cvError`.
	 *
	 * @returns Promise that resolves when the request completes or rejects on timeout/error.
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
	 * Expose TurnoutState enum to template bindings.
	 */
	protected readonly TurnoutState = TurnoutState;

	/**
	 * Set the currently selected locomotive address.
	 *
	 * @param number - new address value
	 */
	public setLocoNumber(number: number): void {
		this.store.selectedAddr.set(number);
	}

	/**
	 * Update UI state for whether the speed control is being dragged.
	 *
	 * @param dragging - true if the user is actively dragging the speed control
	 */
	public draggingSpeed(dragging: boolean): void {
		this.store.draggingSpeed.set(dragging);
	}
}
