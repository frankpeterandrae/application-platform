/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type LocoManager, type TrackStatusManager } from '@application-platform/domain';
import { type ServerToClient } from '@application-platform/protocol';
import { deriveTrackFlagsFromSystemState, type DerivedTrackFlags, type Z21RxPayload } from '@application-platform/z21';
import type { LocoInfo } from '@application-platform/z21-shared';

export type BroadcastFn = (msg: ServerToClient) => void;

/**
 * Handles inbound Z21 payloads, updates track status, and emits server-to-client events.
 */
export class Z21EventHandler {
	constructor(
		private readonly trackStatusManager: TrackStatusManager,
		private readonly broadcast: BroadcastFn,
		private readonly locoManager: LocoManager
	) {}

	/**
	 * Dispatches incoming Z21 messages:
	 * - serial: forwards raw serial events
	 * - system.state: forwards state snapshot
	 * - datasets: processes contained events and rebroadcasts datasets/events
	 */
	public handle(payload: Z21RxPayload): void {
		if (payload.type === 'serial') {
			// eslint-disable-next-line no-console
			console.log('[z21] serial =', payload.serial, 'from', payload.from);

			this.broadcast({
				type: 'system.message.z21.rx',
				rawHex: payload.rawHex,
				datasets: [{ kind: 'serial', serial: payload.serial, from: payload.from }],
				events: [{ type: 'serial', serial: payload.serial }]
			});
			return;
		}

		// top-level system state snapshots use the 'ds.system.state' kind
		if (payload.type === 'system.state') {
			this.broadcast({
				type: 'system.message.z21.rx',
				rawHex: payload.rawHex,
				datasets: [{ kind: 'ds.system.state', from: payload.from, payload: payload.payload }],
				events: [{ type: 'event.system.state', state: payload.payload }]
			});
			return;
		}

		// Process events
		for (const e of payload.events) {
			if (e.type === 'event.track.power') {
				this.updateTrackPowerFromXbus(e.on);
			}

			if (e.type === 'event.z21.status') {
				const flags = deriveTrackFlagsFromSystemState({
					centralState: e.payload.centralState,
					centralStateEx: e.payload.centralStateEx
				});
				this.updateTrackStatusFromSystemState(flags);

				const status = this.trackStatusManager.getStatus();
				// eslint-disable-next-line no-console
				console.log(
					'[z21] systemState cs=0x' + e.payload.centralState.toString(16).padStart(2, '0'),
					'cse=0x' + e.payload.centralStateEx.toString(16).padStart(2, '0'),
					'powerOn?',
					status.powerOn,
					'short?',
					status.short,
					'estop?',
					status.emergencyStop
				);
				continue;
			}

			if (e.type === 'event.loco.info') {
				this.updateLocoInfoFromZ21(e as unknown as LocoInfo);
				continue;
			}

			if (e.type === 'event.turnout.info') {
				this.broadcast({ type: 'switching.message.turnout.state', addr: e.addr, state: e.state });
			}
		}

		// Only emit raw z21.rx when there are no events to process (empty events array)

		this.broadcast({
			type: 'system.message.z21.rx',
			rawHex: payload.rawHex,
			datasets: payload.datasets,
			events: payload.events
		});
	}

	/**
	 * Updates track power status based on X-Bus power signal and notifies clients.
	 */
	private updateTrackPowerFromXbus(on: boolean): void {
		const status = this.trackStatusManager.updateFromXbusPower(on);
		this.broadcast({
			type: 'system.message.trackpower',
			on,
			short: status.short ?? false
		});
	}

	/**
	 * Updates track status from derived system state flags and notifies clients.
	 */
	private updateTrackStatusFromSystemState(flags: DerivedTrackFlags): void {
		const status = this.trackStatusManager.updateFromSystemState(flags);
		this.broadcast({
			type: 'system.message.trackpower',
			on: status.powerOn ?? false,
			short: status.short ?? false,
			emergencyStop: status.emergencyStop
		});
	}

	/**
	 * Updates locomotive information from Z21 event and notifies clients.
	 */
	private updateLocoInfoFromZ21(locoInfo: LocoInfo): void {
		const locoState = this.locoManager.updateLocoInfoFromZ21(locoInfo);
		this.broadcast({
			type: 'loco.message.state',
			addr: locoState.addr,
			speed: locoState.state.speed,
			dir: locoState.state.dir,
			fns: locoState.state.fns,
			estop: locoState.state.estop
		});
	}
}
