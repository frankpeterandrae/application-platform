/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type LocoManager, type TrackStatusManager } from '@application-platform/domain';
import { type ServerToClient } from '@application-platform/protocol';
import {
	datasetsToEvents,
	decodeSystemState,
	deriveTrackFlagsFromSystemState,
	parseZ21Datagram,
	Z21UdpDatagram,
	type DerivedTrackFlags
} from '@application-platform/z21';
import { LocoInfo, Z21LanHeader } from '@application-platform/z21-shared';

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
	public handleDatagram(dg: Z21UdpDatagram): void {
		const { raw, rawHex, from } = dg;

		// Envelope (for Serial etc.)
		if (raw.length >= 4) {
			const len = raw.readUInt16LE(0);
			const header = raw.readUInt16LE(2);

			// Serial-Reply (as previously handled in UDP-Layer)
			if (len === 0x0008 && header === Z21LanHeader.LAN_GET_SERIAL_NUMBER && raw.length >= 8) {
				const serial = raw.readUInt32LE(4);

				// eslint-disable-next-line no-console
				console.log('[z21] serial =', serial, 'from', from);

				this.broadcast({
					type: 'system.message.z21.rx',
					rawHex,
					datasets: [{ kind: 'serial', serial, from }],
					events: [{ type: 'serial', serial }]
				});
				return;
			}
		}

		// Datagram -> Datasets (this is now server responsibility)
		const datasets = parseZ21Datagram(raw);

		// SystemState-Snapshot (if you want to keep this "special" broadcast form)
		// (in case parseZ21Datagram delivers system.state as Dataset)
		const sys = datasets.find((d) => d.kind === 'ds.system.state');
		if (sys?.kind === 'ds.system.state') {
			// Previously this was payload.payload (already decoded).
			// If you still want decoded state, decode here – not in the UDP-Layer.
			// -> Use the existing decode function you already have.
			const state = decodeSystemState(sys.state);

			this.broadcast({
				type: 'system.message.z21.rx',
				rawHex,
				datasets: [{ kind: 'ds.system.state', from, payload: state }],
				events: [{ type: 'event.system.state', state }]
			});

			// Derive track status as before
			const flags = deriveTrackFlagsFromSystemState({
				centralState: state.centralState,
				centralStateEx: state.centralStateEx
			});
			this.updateTrackStatusFromSystemState(flags);

			// Continue execution anyway (or return; depending on what you want)
			// return; // optional
		}

		// Default: datasets -> events
		const events = datasets.flatMap(datasetsToEvents);
		// Process events
		for (const e of events) {
			if (e.type === 'event.z21.status') {
				const flags = deriveTrackFlagsFromSystemState({
					centralState: e.payload.centralState,
					centralStateEx: e.payload.centralStateEx
				});
				this.updateTrackStatusFromSystemState(flags);
				continue;
			}

			if (e.type === 'event.loco.info') {
				this.updateLocoInfoFromZ21(e as unknown as LocoInfo);
				continue;
			}

			if (e.type === 'event.turnout.info') {
				this.broadcast({ type: 'switching.message.turnout.state', addr: e.addr, state: e.state });
				continue;
			}

			if (e.type === 'event.track.power') {
				this.updateTrackPowerFromXbus(e.on);
			}
		}

		// Only emit raw z21.rx when there are no events to process (empty events array)
		// eslint-disable-next-line no-console
		console.log('[z21.rx] rawHex=', rawHex, 'datasets=', datasets, 'events=', events);

		this.broadcast({ type: 'system.message.z21.rx', rawHex, datasets, events });
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
