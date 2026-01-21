/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TrackStatusManager, type CommandStationInfo, type LocoManager } from '@application-platform/domain';
import type { ServerToClient } from '@application-platform/protocol';
import type { DerivedTrackFlags, Z21Dataset, Z21Event, Z21UdpDatagram, Z21UdpFrom } from '@application-platform/z21';
import { datasetsToEvents, decodeSystemState, deriveTrackFlagsFromSystemState, parseZ21Datagram } from '@application-platform/z21';
import {
	Z21LanHeader,
	type HardwareType,
	type LocoInfoEvent,
	type Logger,
	type Z21CodeEvent,
	type Z21FirmwareVersionEvent,
	type Z21HwinfoEvent,
	type Z21StatusEvent,
	type Z21StoppedEvent,
	type Z21VersionEvent
} from '@application-platform/z21-shared';

import type { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';
import type { CvProgrammingService } from '../services/cv-programming-service';

export type BroadcastFn = (msg: ServerToClient) => void;

/**
 * Handles inbound Z21 payloads, updates track status, and emits server-to-client events.
 */
export class Z21EventHandler {
	private readonly trackStatusManager: TrackStatusManager;
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

		// Envelope (for Serial etc.) - keep this small and delegate the rest
		if (raw.length >= 4 && len === 0x0008 && header === Z21LanHeader.LAN_GET_SERIAL_NUMBER && raw.length >= 8) {
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

		// Parse and delegate full processing to a helper to reduce cognitive complexity
		const datasets = parseZ21Datagram(raw);
		this.processParsedDatagram(datasets, dg, header, len, from, rawHex);
	}

	/**
	 * Handles the bulk of the datagram processing. Split out to lower cognitive complexity of handleDatagram.
	 */
	private processParsedDatagram(
		datasets: Z21Dataset[],
		dg: Z21UdpDatagram,
		header: number,
		len: number,
		from: Z21UdpFrom,
		rawHex: string
	): void {
		// Log dataset-level issues (unknown / bad_xor)
		for (const ds of datasets) {
			this.logger.debug('z21.dataset', { ds });
			this.logDatasetIssues(ds, from, rawHex);
		}

		// Handle a system state snapshot dataset once (if present)
		const sys = datasets.find((d) => d.kind === 'ds.system.state');
		if (sys?.kind === 'ds.system.state') {
			this.handleSystemStateDataset(sys, rawHex, from);
		}

		// Default: datasets -> events
		const usableDatasets = datasets.filter((d) => d.kind !== 'ds.unknown' && d.kind !== 'ds.bad_xor');
		const events = usableDatasets.flatMap(datasetsToEvents);

		// Let CV programming service observe CV events before further processing
		this.forwardCvEvents(events);

		for (const event of events) {
			this.handleEvent(event, datasets, dg);
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

	/**
	 * Logs unknown/bad datasets found in a parsed datagram.
	 */
	private logDatasetIssues(ds: Z21Dataset, from: Z21UdpFrom, rawHex: string): void {
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
	}

	/**
	 * Handle the special "system.state" dataset: decode, broadcast and update track status.
	 */
	private handleSystemStateDataset(sys: Z21Dataset, rawHex: string, from: Z21UdpFrom): void {
		if (sys.kind !== 'ds.system.state') return;

		const state = decodeSystemState(sys.state);

		this.broadcast({
			type: 'system.message.z21.rx',
			payload: {
				rawHex,
				datasets: [{ kind: 'ds.system.state', from, payload: state }],
				events: [{ type: 'event.system.state', state }]
			}
		});

		const flags = deriveTrackFlagsFromSystemState({
			centralState: state.centralState,
			centralStateEx: state.centralStateEx
		});
		this.updateTrackStatusFromSystemState(flags);
	}

	/**
	 * Forward CV-related events to the CV programming service so it can resolve any waiting promises.
	 */
	private forwardCvEvents(events: readonly Z21Event[]): void {
		for (const ev of events) {
			if (ev.type === 'event.cv.result' || ev.type === 'event.cv.nack') {
				this.cvProgrammingService.onEvent(ev);
			}
		}
	}

	/**
	 * Central switch to handle individual events. Kept small by delegating to helpers.
	 */
	private handleEvent(event: Z21Event, datasets: Z21Dataset[], dg: Z21UdpDatagram): void {
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
				this.broadcast({
					type: 'switching.message.turnout.state',
					payload: { addr: event.addr, state: event.state }
				});
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
					events: datasets.flatMap(datasetsToEvents)
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
				this.handleXBusVersion(event);
				break;
			}
			case 'event.z21.firmware.version': {
				this.handleFirmwareVersion(event);
				break;
			}
			case 'event.z21.stopped': {
				this.handleStopped(event);
				break;
			}
			case 'event.z21.hwinfo': {
				this.handleHwInfo(event);
				break;
			}
			case 'event.z21.code': {
				this.handleCode(event);
				break;
			}
			case 'event.cv.result':
			case 'event.cv.nack':
				// Already forwarded to CvProgrammingService before switch-case
				// Nothing more to do here
				break;
			default: {
				this.logUnknown('x_bus', 'unknown', {
					from: dg.from,
					hex: dg.rawHex
				});
			}
		}
	}

	private handleXBusVersion(ev: Z21VersionEvent): void {
		this.logger.info('z21.x.bus.version', ev);

		this.commandStationInfo.setXBusVersion(ev);
		if (ev.cmdsId === 0x12 || ev.cmdsId === 0x13) {
			const hardwareType: HardwareType = ev.cmdsId === 0x12 ? 'Z21_OLD' : 'z21_START';
			this.commandStationInfo.setHardwareType(hardwareType);
			this.broadcast({ type: 'system.message.hardware.info', payload: { hardwareType } });
		}
		this.broadcast({
			type: 'system.message.x.bus.version',
			payload: { version: ev.xBusVersionString, cmdsId: ev.cmdsId }
		});
		this.csInfoOrchestrator.poke();
		this.csInfoOrchestrator.ack('xBusVersion');
	}

	private handleFirmwareVersion(ev: Z21FirmwareVersionEvent): void {
		this.logger.info('z21.firmware.version', ev);
		this.commandStationInfo.setFirmwareVersion(ev);
		this.broadcast({ type: 'system.message.firmware.version', payload: { major: ev.major, minor: ev.minor } });
		this.csInfoOrchestrator.poke();
		this.csInfoOrchestrator.ack('firmware');
	}

	private handleStopped(ev: Z21StoppedEvent): void {
		this.logger.info('z21.stopped', ev);
		this.trackStatusManager.setEmergencyStop(true, 'ds.lan.x');
		this.broadcast({ type: 'system.message.stop', payload: {} });
	}

	private handleHwInfo(ev: Z21HwinfoEvent): void {
		this.logger.info('z21.hwinfo', ev);
		this.commandStationInfo.setFirmwareVersion({ major: ev.payload.majorVersion, minor: ev.payload.minorVersion });
		this.commandStationInfo.setHardwareType(ev.payload.hardwareType);
		this.broadcast({
			type: 'system.message.firmware.version',
			payload: { major: ev.payload.majorVersion, minor: ev.payload.minorVersion }
		});
		this.broadcast({ type: 'system.message.hardware.info', payload: { hardwareType: ev.payload.hardwareType } });
		this.csInfoOrchestrator.poke();
		this.csInfoOrchestrator.ack('hwinfo');
	}

	private handleCode(ev: Z21CodeEvent): void {
		this.logger.info('z21.code', ev);
		this.commandStationInfo.setCode(ev.code);
		this.broadcast({ type: 'system.message.z21.code', payload: { code: ev.code } });
		this.csInfoOrchestrator.ack('code');
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
