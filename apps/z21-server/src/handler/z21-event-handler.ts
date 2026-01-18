/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandStationInfo, LocoManager, TrackStatusManager } from '@application-platform/domain';
import type { ServerToClient } from '@application-platform/protocol';
import {
	datasetsToEvents,
	decodeSystemState,
	deriveTrackFlagsFromSystemState,
	parseZ21Datagram,
	Z21UdpDatagram,
	type DerivedTrackFlags
} from '@application-platform/z21';
import { LocoInfoEvent, Logger, Z21LanHeader, Z21StatusEvent } from '@application-platform/z21-shared';

export type BroadcastFn = (msg: ServerToClient) => void;

/**
 * Handles inbound Z21 payloads, updates track status, and emits server-to-client events.
 */
export class Z21EventHandler {
	constructor(
		private readonly trackStatusManager: TrackStatusManager,
		private readonly broadcast: BroadcastFn,
		private readonly locoManager: LocoManager,
		private readonly logger: Logger,
		private readonly commandStationInfo: CommandStationInfo
	) {}

	/**
	 * Dispatches incoming Z21 messages:
	 * - serial: forwards raw serial events
	 * - system.state: forwards state snapshot
	 * - datasets: processes contained events and rebroadcasts datasets/events
	 */
	public handleDatagram(dg: Z21UdpDatagram): void {
		const { raw, rawHex, from } = dg;

		const len = raw.readUInt16LE(0);
		const header = raw.readUInt16LE(2);
		// Envelope (for Serial etc.)
		if (raw.length >= 4) {
			// Serial-Reply (as previously handled in UDP-Layer)
			if (len === 0x0008 && header === Z21LanHeader.LAN_GET_SERIAL_NUMBER && raw.length >= 8) {
				const serial = raw.readUInt32LE(4);

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

		for (const ds of datasets) {
			if (ds.kind === 'ds.unknown') {
				this.logUnknown('frame', 'unknown', {
					from,
					header: ds.header,
					reason: ds.reason,
					payload: Array.from(ds.payload),
					hex: rawHex
				});
			}

			if (ds.kind === 'ds.bad_xor') {
				this.logUnknown('frame', 'bad_xor', { from, calc: ds.calc, recv: ds.recv, hex: rawHex });
			}

			// SystemStateEvent-Snapshot (if you want to keep this "special" broadcast form)
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
					datasets: [{ kind: 'system.state', from, payload: state }],
					events: [{ type: 'system.state', state }]
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
			const usableDatasets = datasets.filter((d) => d.kind === 'ds.x.bus' || d.kind === 'ds.system.state');
			const events = usableDatasets.flatMap(datasetsToEvents);

			for (const event of events) {
				switch (event.type) {
					case 'event.system.state': {
						const flags = deriveTrackFlagsFromSystemState({
							centralState: event.payload.centralState,
							centralStateEx: event.payload.centralStateEx
						});
						this.updateTrackStatusFromSystemState(flags);
						break;
					}
					case 'event.loco.info': {
						this.updateLocoInfoFromZ21(event);
						break;
					}
					case 'event.turnout.info': {
						this.broadcast({ type: 'switching.message.turnout.state', addr: event.addr, state: event.state });
						break;
					}
					case 'event.track.power': {
						this.updateTrackPowerFromXbus(event.on);
						break;
					}
					case 'event.unknown.lan_x': {
						this.logUnknown('lan_x', event.type, {
							from: dg.from,
							hex: dg.rawHex,
							datasets,
							events
						});
						break;
					}
					case 'event.z21.status': {
						this.updateTrackStatusFromLanX(event);
						break;
					}
					case 'event.unknown.x.bus': {
						this.logUnknown('x_bus', event.type, {
							from: dg.from,
							hex: dg.rawHex,
							xHeader: event.xHeader,
							bytes: event.bytes
						});
						break;
					}
					case 'event.z21.version': {
						this.logger.info('event.z21.version', event);
						this.commandStationInfo.setVersion(event);
						this.broadcast({ type: 'system.message.z21.version', version: event.versionString, cmdsId: event.cmdsId });
						break;
					}
					case 'event.z21.stopped': {
						this.logger.info('event.z21.stopped', event);
						this.trackStatusManager.setEmergencyStop(true, 'ds.lan.x');
						this.broadcast({ type: 'system.message.stop' });
						break;
					}
					default: {
						this.logUnknown('x_bus', event, {
							from: dg.from,
							hex: dg.rawHex
						});
					}
				}
			}

			this.logger.info('z21.rx', {
				from: dg.from,
				len: dg.raw.length,
				// falls du header/len aus envelope liest:
				header,
				frameLen: len,
				datasetKinds: datasets.map((d) => d.kind),
				eventTypes: events.map((e) => e.type)
			});
			this.logger.debug('z21.rx.raw', { from: dg.from, hex: dg.rawHex });
		}
	}

	private logUnknown(
		scope: 'frame' | 'lan_x' | 'x_bus',
		unknownKind: string,
		meta: Record<string, unknown> & { from: { address: string; port: number }; hex?: string }
	): void {
		this.logger.warn('z21.unknown', { scope, unknownKind, ...meta });
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

	private updateTrackStatusFromLanX(z21StatusEvent: Z21StatusEvent): void {
		const status = this.trackStatusManager.updateFromLanX(z21StatusEvent);
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
	private updateLocoInfoFromZ21(locoInfo: LocoInfoEvent): void {
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
