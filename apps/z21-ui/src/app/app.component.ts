/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { KeyValuePipe, type KeyValue } from '@angular/common';
import { Component, signal } from '@angular/core';
import type { ClientToServer, ServerToClient } from '@application-platform/protocol';
import { PROTOCOL_VERSION } from '@application-platform/protocol';
import { TurnoutState, type Direction } from '@application-platform/z21-shared';

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
	styleUrl: './app.component.scss'
})
export class AppComponent {
	public readonly TurnoutState = TurnoutState;
	/**
	 * Indicates if the speed slider is currently being dragged.
	 * Template can bind to this signal to adjust UI behavior during dragging.
	 */
	public draggingSpeed = signal(false);
	/**
	 * Connection status signal. Values: 'connected' | 'disconnected'.
	 * Template can subscribe to this signal to display connection state.
	 */
	public status = signal('disconnected');

	/**
	 * Last raw message received from the server (pretty-printed JSON).
	 * Useful for debugging / UI display of incoming messages.
	 */
	public lastMsg = signal('');

	/**
	 * Currently selected locomotive address (UI control).
	 */
	public addr = signal(1845);

	/**
	 * Current speed value held in the UI; use `setSpeed` to update and notify the server.
	 */
	public speed = signal(0);

	/**
	 * Current direction selection for the locomotive.
	 * Allowed values: 'FWD' | 'REV'.
	 */
	public dir = signal<Direction>('FWD');

	/**
	 * Example function/feature toggle (f0).
	 */
	public functions = signal<Record<number, boolean>>({});

	/**
	 * Turnout (switch) address selected in the UI.
	 */
	public turnoutAddr = signal(12);

	/**
	 * Track power state signal; true if power is on, false if off.
	 */
	public powerOn = signal(false);

	/**
	 * Underlying WebSocket used for server communication.
	 * Undefined if not yet connected or if connection has been closed.
	 * @private
	 */
	private ws?: WebSocket;

	/**
	 * Numeric key sorting function for KeyValuePipe.
	 * Ensures that keys which can be parsed as numbers are sorted numerically.
	 * Non-numeric keys are sorted lexicographically after numeric keys.
	 * @param a - First key-value pair
	 * @param b - Second key-value pair
	 * @returns Negative if a < b, positive if a > b, zero if equal
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
	 * Initialize component and establish WebSocket connection.
	 *
	 * The constructor invokes `connect()` to open the socket immediately
	 * so the UI can start sending/receiving messages.
	 */
	constructor() {
		this.connect();
	}

	/**
	 * Set the locomotive speed locally and send a `loco.set` command to the server.
	 *
	 * - Updates the local `speed` signal.
	 * - Sends a `ClientToServer` message describing the new speed and direction.
	 * - Logs the action to the console for quick debugging.
	 *
	 * @param v - Target speed value (numeric scale used by the UI/protocol).
	 */
	public setSpeed(v: number): void {
		const step = this.uiSpeedToStep128(v);
		this.speed.set(v);
		// eslint-disable-next-line no-console
		console.log({ type: 'loco.command.drive', addr: this.addr(), speed: step, dir: this.dir(), steps: 128 });
		this.send({ type: 'loco.command.drive', addr: this.addr(), speed: v, dir: this.dir(), steps: 128 });
	}

	/**
	 * Send a function (F0..Fn) on/off command for the currently selected locomotive.
	 *
	 * @param fn - Function number to switch (e.g. 0..n).
	 * @param on - `true` to turn the function on, `false` to turn it off.
	 */
	public sendFn(fn: number, on: boolean): void {
		this.send({ type: 'loco.command.function.set', addr: this.addr(), fn, on });
	}

	/**
	 * Send a turnout (switch) command.
	 *
	 * @param state - Either 'STRAIGHT' or 'DIVERGING'.
	 *                The message includes `pulseMs: 200` as an example pulse duration.
	 */
	public sendTurnout(state: TurnoutState): void {
		this.send({ type: 'switching.command.turnout.set', addr: this.turnoutAddr(), state, pulseMs: 200 });
	}

	private clamp01(x: number): number {
		return Math.max(0, Math.min(1, x));
	}

	/**
	 * Send an emergency stop command for the currently selected locomotive.
	 * This will immediately halt the locomotive on the track.
	 */
	public sendEStop(): void {
		this.send({ type: 'loco.command.eStop', addr: this.addr() });
	}

	private uiSpeedToStep128(ui: number): number {
		// 0..1 -> 0..126
		return Math.round(this.clamp01(ui) * 126);
	}

	private connect(): void {
		const proto = location.protocol === 'https:' ? 'wss' : 'ws';
		this.ws = new WebSocket(`${proto}://${location.host}`);
		this.ws.onopen = (): void => {
			this.status.set('connected');
			this.send({ type: 'server.command.session.hello', protocolVersion: PROTOCOL_VERSION, clientName: 'ui' });
		};
		this.ws.onclose = (): void => this.status.set('disconnected');
		this.ws.onmessage = (ev): void => {
			const msg = JSON.parse(ev.data) as ServerToClient;
			this.updateFromServer(msg);
			this.lastMsg.set(JSON.stringify(msg, null, 2));
		};
	}

	private send(msg: ClientToServer): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
		this.ws.send(JSON.stringify(msg));
	}

	/**
	 * Toggle track power state and send corresponding command to the server.
	 * If power is currently on, it will be turned off, and vice versa.
	 */
	public togglePower(): void {
		if (this.powerOn()) {
			this.powerOn.set(false);
			this.send({ type: 'system.command.trackpower.set', on: false });
		} else {
			this.powerOn.set(true);
			this.send({ type: 'system.command.trackpower.set', on: true });
		}
	}

	private updateFromServer(msg: ServerToClient): void {
		switch (msg.type) {
			case 'system.message.trackpower':
				this.powerOn.set(msg.on);
				break;
			case 'loco.message.state':
				if (msg.addr === this.addr()) {
					if (this.draggingSpeed()) return;
					this.speed.set(this.step128ToUiSpeed(msg.speed));
					this.dir.set(msg.dir);
					this.functions.set(msg.fns);
				}
				break;
			case 'switching.message.turnout.state':
			case 'server.replay.session.ready':
			case 'feedback.message.changed':
			case 'system.message.z21.rx':
			case 'loco.message.eStop':
				// no-op for now
				break;
			default:
				break;
		}
	}

	private step128ToUiSpeed(step: number): number {
		// 0..126 -> 0..1
		if (step <= 0) return 0;
		if (step >= 126) return 1;
		return step / 126;
	}
}
