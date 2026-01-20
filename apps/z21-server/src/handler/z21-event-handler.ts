/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TrackStatusManager, type CommandStationInfo, type LocoManager } from '@application-platform/domain';
import type { ServerToClient } from '@application-platform/protocol';
import type { Z21UdpDatagram } from '@application-platform/z21';
import {
	datasetsToEvents,
	decodeSystemState,
	deriveTrackFlagsFromSystemState,
	parseZ21Datagram,
	type DerivedTrackFlags
} from '@application-platform/z21';
import { Z21LanHeader, type HardwareType, type LocoInfoEvent, type Logger, type Z21StatusEvent } from '@application-platform/z21-shared';

import type { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';
import type { CvProgrammingService } from '../services/cv-programming-service';

export type BroadcastFn = (msg: ServerToClient) => void;

/**
 * Handles inbound Z21 payloads, updates track status, and emits server-to-client events.
 */
export class Z21EventHandler {
	private trackStatusManager: TrackStatusManager;
	/**
	 * Creates a new Z21EventHandler.
	 * @param broadcast - Function to broadcast messages to all WebSocket clients
	 * @param locoManager - Locomotive state manager
	 * @param logger - Logger instance
	 * @param commandStationInfo - Command station information storage
	 * @param csInfoOrchestrator - Command station info orchestrator
	 * @param cvProgrammingService - CV programming service
	 */
	constructor(
		private readonly broadcast: BroadcastFn,
		private readonly locoManager: LocoManager,
		private readonly logger: Logger,
		private readonly commandStationInfo: CommandStationInfo,
		private readonly csInfoOrchestrator: CommandStationInfoOrchestrator,
		private readonly cvProgrammingService: CvProgrammingService
	) {
		this.trackStatusManager = new TrackStatusManager();
	}

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
					payload: {
						rawHex,
						datasets: [{ kind: 'ds.serial', serial, from }],
						events: [{ type: 'event.serial', serial }]
					}
				});
				return;
			}
		}

		// Datagram -> Datasets (this is now server responsibility)
		const datasets = parseZ21Datagram(raw);

		for (const ds of datasets) {
			this.logger.debug('z21.dataset', { ds });
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
					payload: {
						rawHex,
						datasets: [{ kind: 'ds.system.state', from, payload: state }],
						events: [{ type: 'event.system.state', state }]
					}
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
			const usableDatasets = datasets.filter((d) => d.kind !== 'ds.unknown' && d.kind !== 'ds.bad_xor');

			const events = usableDatasets.flatMap(datasetsToEvents);

			for (const event of events) {
				// Forward CV events to CvProgrammingService first
				// This allows the service to resolve promises before we continue processing
				if (event.type === 'event.cv.result' || event.type === 'event.cv.nack') {
					this.cvProgrammingService.onEvent(event);
				}

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
						this.broadcast({ type: 'switching.message.turnout.state', payload: { addr: event.addr, state: event.state } });
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
					case 'event.z21.x.bus.version': {
						this.logger.info('z21.x.bus.version', event);

						this.commandStationInfo.setXBusVersion(event);
						if (event.cmdsId === 0x12 || event.cmdsId === 0x13) {
							const hardwareType: HardwareType = event.cmdsId === 0x12 ? 'Z21_OLD' : 'z21_START';
							this.commandStationInfo.setHardwareType(hardwareType);
							this.broadcast({ type: 'system.message.hardware.info', payload: { hardwareType } });
						}
						this.broadcast({
							type: 'system.message.x.bus.version',
							payload: { version: event.xBusVersionString, cmdsId: event.cmdsId }
						});
						this.csInfoOrchestrator.poke();
						this.csInfoOrchestrator.ack('xBusVersion');
						break;
					}
					case 'event.z21.firmware.version': {
						this.logger.info('z21.firmware.version', event);
						this.commandStationInfo.setFirmwareVersion(event);
						this.broadcast({ type: 'system.message.firmware.version', payload: { major: event.major, minor: event.minor } });
						this.csInfoOrchestrator.poke();
						this.csInfoOrchestrator.ack('firmware');
						break;
					}
					case 'event.z21.stopped': {
						this.logger.info('z21.stopped', event);
						this.trackStatusManager.setEmergencyStop(true, 'ds.lan.x');
						this.broadcast({ type: 'system.message.stop', payload: {} });
						break;
					}
					case 'event.z21.hwinfo': {
						this.logger.info('z21.hwinfo', event);
						this.commandStationInfo.setFirmwareVersion({
							major: event.payload.majorVersion,
							minor: event.payload.minorVersion
						});
						this.commandStationInfo.setHardwareType(event.payload.hardwareType);
						this.broadcast({
							type: 'system.message.firmware.version',
							payload: {
								major: event.payload.majorVersion,
								minor: event.payload.minorVersion
							}
						});
						this.broadcast({ type: 'system.message.hardware.info', payload: { hardwareType: event.payload.hardwareType } });
						this.csInfoOrchestrator.poke();
						this.csInfoOrchestrator.ack('hwinfo');
						break;
					}
					case 'event.z21.code': {
						this.logger.info('z21.code', event);
						this.commandStationInfo.setCode(event.code);
						this.broadcast({ type: 'system.message.z21.code', payload: { code: event.code } });
						this.csInfoOrchestrator.ack('code');
						break;
					}
					case 'event.cv.result':
					case 'event.cv.nack':
						// Already forwarded to CvProgrammingService before switch-case
						// Nothing more to do here
						break;
					default: {
						this.logUnknown('x_bus', event, {
							from: dg.from,
							hex: dg.rawHex
						});
					}
				}
			}

			this.logger.info('system.message.z21.rx', {
				from: dg.from,
				len: dg.raw.length,
				header,
				frameLen: len,
				datasetKinds: datasets.map((d) => d.kind),
				eventTypes: events.map((e) => e.type)
			});
			this.logger.debug('z21.rx.raw', { from: dg.from, hex: dg.rawHex });
		}
	}

	/**
	 * Logs unknown Z21 frames, LAN_X, or X-Bus messages.
	 * @param scope - The scope of the unknown message
	 * @param unknownKind - The type of unknown message
	 * @param meta - Additional metadata including source address and hex data
	 */
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
			payload: {
				on,
				short: status.short ?? false
			}
		});
	}

	/**
	 * Updates track status from derived system state flags and notifies clients.
	 */
	private updateTrackStatusFromSystemState(flags: DerivedTrackFlags): void {
		const status = this.trackStatusManager.updateFromSystemState(flags);
		this.broadcast({
			type: 'system.message.trackpower',
			payload: {
				on: status.powerOn ?? false,
				short: status.short ?? false,
				emergencyStop: status.emergencyStop
			}
		});
	}

	/**
	 * Updates track status from LAN_X command station status event.
	 * @param csStatusEvent - Command station status event
	 */
	private updateTrackStatusFromLanX(csStatusEvent: Z21StatusEvent): void {
		const status = this.trackStatusManager.updateFromLanX(csStatusEvent);
		this.broadcast({
			type: 'system.message.trackpower',
			payload: {
				on: status.powerOn ?? false,
				short: status.short ?? false,
				emergencyStop: status.emergencyStop
			}
		});
	}

	/**
	 * Updates locomotive info from Z21 and broadcasts to clients.
	 * @param locoInfo - Locomotive info event from Z21
	 */
	private updateLocoInfoFromZ21(locoInfo: LocoInfoEvent): void {
		const locoState = this.locoManager.updateLocoInfoFromZ21(locoInfo);
		this.broadcast({
			type: 'loco.message.state',
			payload: {
				addr: locoState.addr,
				speed: locoState.state.speed,
				dir: locoState.state.dir,
				fns: locoState.state.fns,
				estop: locoState.state.estop
			}
		});
	}
}
