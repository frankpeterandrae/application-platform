/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TrackStatusManager, type CommandStationInfo, type LocoManager } from '@application-platform/domain';
import type { ServerToClient } from '@application-platform/protocol';
import type { Z21Dataset, Z21UdpDatagram, Z21UdpFrom } from '@application-platform/z21';
import { datasetsToEvents, decodeSystemState, deriveTrackFlagsFromSystemState, parseZ21Datagram } from '@application-platform/z21';
import {
	LocoInfoEventPayload,
	PowerPayload,
	Z21Event,
	Z21LanHeader,
	type HardwareType,
	type Logger,
	type Z21CodeEvent,
	type Z21FirmwareVersionEvent,
	type Z21HwinfoEvent,
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
					events: [{ event: 'event.serial', serial }]
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
			eventTypes: events.map((e) => e.event)
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
				events: [{ event: 'system.event.state', state }]
			}
		});

		const flags = deriveTrackFlagsFromSystemState({
			centralState: state.centralState,
			centralStateEx: state.centralStateEx
		});
		const payload: PowerPayload = {
			powerOn: !!flags.powerOn,
			emergencyStop: !!flags.emergencyStop,
			shortCircuit: !!flags.shortCircuit,
			programmingMode: !!flags.programmingMode
		};
		this.updateTrackPower(payload, sys.kind);
	}

	/**
	 * Forward CV-related events to the CV programming service so it can resolve any waiting promises.
	 */
	private forwardCvEvents(events: readonly Z21Event[]): void {
		for (const event of events) {
			if (event.event === 'programming.event.cv.result' || event.event === 'programming.event.cv.nack') {
				this.cvProgrammingService.onEvent(event);
			}
		}
	}

	/**
	 * Central switch to handle individual events. Kept small by delegating to helpers.
	 */
	private handleEvent(event: Z21Event, datasets: Z21Dataset[], dg: Z21UdpDatagram): void {
		switch (event.event) {
			case 'system.event.state': {
				const flags = deriveTrackFlagsFromSystemState({
					centralState: event.payload.centralState,
					centralStateEx: event.payload.centralStateEx
				});
				const payload: PowerPayload = {
					powerOn: !!flags.powerOn,
					emergencyStop: !!flags.emergencyStop,
					shortCircuit: !!flags.shortCircuit,
					programmingMode: !!flags.programmingMode
				};
				this.updateTrackPower(payload, 'ds.lan.x');
				break;
			}
			case 'loco.event.info': {
				this.updateLocoInfoFromZ21(event.payload);
				break;
			}
			case 'switching.event.turnout.info': {
				this.broadcast({
					type: 'switching.message.turnout.state',
					payload: { addr: event.payload.addr, state: event.payload.state }
				});
				break;
			}
			case 'system.event.track.power': {
				this.updateTrackPower(event.payload, 'ds.lan.x');
				break;
			}
			case 'event.unknown.lan_x': {
				this.logUnknown('lan_x', event.event, {
					from: dg.from,
					hex: dg.rawHex,
					datasets,
					events: datasets.flatMap(datasetsToEvents)
				});
				break;
			}
			case 'system.event.status': {
				this.updateTrackPower(event.payload, 'ds.lan.x');
				break;
			}
			case 'event.unknown.x.bus': {
				this.logUnknown('x_bus', event.event, {
					from: dg.from,
					hex: dg.rawHex,
					xHeader: event.xHeader,
					bytes: event.bytes
				});
				break;
			}
			case 'system.event.x.bus.version': {
				this.handleXBusVersion(event);
				break;
			}
			case 'system.event.firmware.version': {
				this.handleFirmwareVersion(event);
				break;
			}
			case 'system.event.stopped': {
				this.handleStopped(event);
				break;
			}
			case 'system.event.hwinfo': {
				this.handleHwInfo(event);
				break;
			}
			case 'system.event.z21.code': {
				this.handleCode(event);
				break;
			}
			case 'programming.event.cv.result':
			case 'programming.event.cv.nack':
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

	private handleXBusVersion(event: Z21VersionEvent): void {
		this.logger.info('z21.x.bus.version', event);

		this.commandStationInfo.setXBusVersion(event.payload);
		if (event.payload.cmdsId === 0x12 || event.payload.cmdsId === 0x13) {
			const hardwareType: HardwareType = event.payload.cmdsId === 0x12 ? 'Z21_OLD' : 'z21_START';
			this.commandStationInfo.setHardwareType(hardwareType);
			this.broadcast({ type: 'system.message.hardware.info', payload: { hardwareType } });
		}
		this.broadcast({
			type: 'system.message.x.bus.version',
			payload: { version: event.payload.xBusVersionString, cmdsId: event.payload.cmdsId }
		});
		this.csInfoOrchestrator.poke();
		this.csInfoOrchestrator.ack('xBusVersion');
	}

	private handleFirmwareVersion(event: Z21FirmwareVersionEvent): void {
		this.logger.info('z21.firmware.version', event);
		this.commandStationInfo.setFirmwareVersion(event.payload);
		this.broadcast({ type: 'system.message.firmware.version', payload: { major: event.payload.major, minor: event.payload.minor } });
		this.csInfoOrchestrator.poke();
		this.csInfoOrchestrator.ack('firmware');
	}

	private handleStopped(event: Z21StoppedEvent): void {
		this.logger.info('z21.stopped', event);
		this.trackStatusManager.setEmergencyStop(true, 'ds.lan.x');
		this.broadcast({ type: 'system.message.stop', payload: {} });
	}

	private handleHwInfo(event: Z21HwinfoEvent): void {
		this.logger.info('z21.hwinfo', event);
		this.commandStationInfo.setFirmwareVersion({ major: event.payload.majorVersion, minor: event.payload.minorVersion });
		this.commandStationInfo.setHardwareType(event.payload.hardwareType);
		this.broadcast({
			type: 'system.message.firmware.version',
			payload: { major: event.payload.majorVersion, minor: event.payload.minorVersion }
		});
		this.broadcast({ type: 'system.message.hardware.info', payload: { hardwareType: event.payload.hardwareType } });
		this.csInfoOrchestrator.poke();
		this.csInfoOrchestrator.ack('hwinfo');
	}

	private handleCode(event: Z21CodeEvent): void {
		this.logger.info('z21.code', event);
		this.commandStationInfo.setCode(event.payload.code);
		this.broadcast({ type: 'system.message.z21.code', payload: { code: event.payload.code } });
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
	private updateTrackPower(payload: PowerPayload, source: 'ds.x.bus' | 'ds.system.state' | 'ds.lan.x'): void {
		const status = this.trackStatusManager.updateStatus(payload, source);
		this.broadcast({
			type: 'system.message.trackpower',
			payload: status
		});
	}

	/**
	 * Updates locomotive info from Z21 and broadcasts to clients.
	 * @param locoInfo - Locomotive info event from Z21
	 */
	private updateLocoInfoFromZ21(locoInfo: LocoInfoEventPayload): void {
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
