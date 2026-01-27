/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoManager } from '@application-platform/domain';
import { type ClientToServer, type ServerToClient } from '@application-platform/protocol';
import { LocoFunctionSwitchType, type Z21CommandService } from '@application-platform/z21';
import { Direction, TurnoutState } from '@application-platform/z21-shared';
import type { WebSocket as WsWebSocket } from 'ws';

import type { CvProgrammingService } from '../services/cv-programming-service';

/**
 * Function signature used to emit server-to-client protocol messages.
 * @param msg - The message to broadcast to connected clients
 */
export type BroadcastFn = (msg: ServerToClient) => void;

export type ReplyFn = (ws: WsWebSocket, msg: ServerToClient) => void;

/**
 * Handles validated client-to-server messages and coordinates actions
 * across the locomotive manager and Z21 UDP gateway, emitting resulting
 * server-to-client updates.
 */
export class ClientMessageHandler {
	private readonly driveThrottleMs = 50;

	private readonly pendingDrives = new Map<number, { speed: number; dir: Direction }>();
	private readonly driveTimers = new Map<number, NodeJS.Timeout>();

	/**
	 * Creates a new ClientMessageHandler.
	 * @param locoManager - Manages locomotive state (speed, direction, functions)
	 * @param z21Service - Z21 UDP transport used for signaling/demo pings
	 * @param cvProgrammingService - Service for CV programming operations
	 * @param reply - Function to reply to specific WebSocket clients
	 * @param broadcast - Function to emit server-to-client messages
	 */
	constructor(
		private readonly locoManager: LocoManager,
		private readonly z21Service: Z21CommandService,
		private readonly cvProgrammingService: CvProgrammingService,
		private readonly reply: ReplyFn,
		private readonly broadcast: BroadcastFn
	) {}

	/**
	 * Routes an incoming validated client message to the appropriate handler
	 * and emits corresponding state updates to clients.
	 *
	 * Supported messages:
	 * - server.command.session.hello: currently ignored
	 * - system.command.trackpower.set: toggles track power and notifies clients
	 * - loco.command.drive: sets locomotive speed and direction, then broadcasts state
	 * - loco.command.function.set: toggles a locomotive function, then broadcasts state
	 * - switching.command.turnout.set: sets turnout state and notifies clients
	 *
	 * @param msg - The client-to-server protocol message
	 * @param ws - The WebSocket connection from which the message originated
	 */
	public async handle(msg: ClientToServer, ws: WsWebSocket): Promise<void> {
		switch (msg.type) {
			case 'server.command.session.hello': {
				// ignore for now
				break;
			}

			case 'system.command.trackpower.set': {
				// Ping the Z21 gateway (demo behavior), then broadcast new power state
				this.z21Service.sendTrackPower(msg.payload.powerOn);
				this.broadcast({
					type: 'system.message.trackpower',
					payload: { powerOn: msg.payload.powerOn, shortCircuit: false, emergencyStop: false, programmingMode: false }
				});
				break;
			}
			case 'loco.command.drive': {
				// Update locomotive speed/direction and inform clients of the new state
				const st = this.locoManager.setSpeed(msg.payload.addr, msg.payload.speed, msg.payload.dir);
				this.pendingDrives.set(msg.payload.addr, { speed: msg.payload.speed, dir: msg.payload.dir });
				this.scheduleDrive(msg.payload.addr);
				this.broadcast({
					type: 'loco.message.state',
					payload: {
						addr: msg.payload.addr,
						speed: st.speed,
						dir: st.dir,
						fns: st.fns,
						estop: st.estop
					}
				});
				break;
			}

			case 'loco.command.function.set': {
				// Toggle a locomotive function and broadcast the updated locomotive state
				const st = this.locoManager.setFunction(msg.payload.addr, msg.payload.fn, msg.payload.on);
				this.z21Service.setLocoFunction(
					msg.payload.addr,
					msg.payload.fn,
					msg.payload.on ? LocoFunctionSwitchType.ON : LocoFunctionSwitchType.OFF
				);
				this.broadcast({
					type: 'loco.message.state',
					payload: {
						addr: msg.payload.addr,
						speed: st.speed,
						dir: st.dir,
						fns: st.fns,
						estop: st.estop
					}
				});
				break;
			}

			case 'loco.command.function.toggle': {
				// Toggle a locomotive function and broadcast the updated locomotive state
				const st = this.locoManager.setFunction(
					msg.payload.addr,
					msg.payload.fn,
					!(this.locoManager.getState(msg.payload.addr)?.fns[msg.payload.fn] ?? false)
				);
				this.z21Service.setLocoFunction(msg.payload.addr, msg.payload.fn, LocoFunctionSwitchType.TOGGLE);
				this.broadcast({
					type: 'loco.message.state',
					payload: {
						addr: msg.payload.addr,
						speed: st.speed,
						dir: st.dir,
						fns: st.fns,
						estop: st.estop
					}
				});
				break;
			}

			case 'loco.command.eStop': {
				// Emergency stop a locomotive and broadcast the updated state
				const t = this.driveTimers.get(msg.payload.addr);
				if (t) {
					clearTimeout(t);
				}

				this.driveTimers.delete(msg.payload.addr);
				this.pendingDrives.delete(msg.payload.addr);

				this.z21Service.setLocoEStop(msg.payload.addr);
				this.z21Service.getLocoInfo(msg.payload.addr);
				break;
			}

			case 'switching.command.turnout.set': {
				// Update turnout state and notify clients
				const port: 0 | 1 = msg.payload.state === TurnoutState.DIVERGING ? 1 : 0;
				this.z21Service.setTurnout(msg.payload.addr, port, { queue: true, pulseMs: msg.payload.pulseMs ?? 100 });
				this.z21Service.getTurnoutInfo(msg.payload.addr);
				break;
			}

			case 'loco.command.stop.all': {
				this.z21Service.setStop();
				break;
			}

			case 'programming.command.cv.read': {
				const requestId = msg.payload.requestId;
				try {
					const res = await this.cvProgrammingService.readCv(msg.payload.cvAdress);
					this.reply(ws, {
						type: 'programming.replay.cv.result',
						payload: {
							requestId,
							cvAdress: res.cvAdress,
							cvValue: res.cvValue
						}
					});
				} catch (err) {
					this.reply(ws, {
						type: 'programming.replay.cv.nack',
						payload: {
							requestId,
							error: (err as Error).message
						}
					});
				}
				break;
			}

			case 'programming.command.cv.write': {
				const requestId = msg.payload.requestId;
				try {
					await this.cvProgrammingService.writeCv(msg.payload.cvAdress, msg.payload.cvValue);
					this.reply(ws, {
						type: 'programming.replay.cv.result',
						payload: {
							requestId,
							cvAdress: msg.payload.cvAdress,
							cvValue: msg.payload.cvValue
						}
					});
				} catch (err) {
					this.reply(ws, {
						type: 'programming.replay.cv.nack',
						payload: {
							requestId,
							error: (err as Error).message
						}
					});
				}
				break;
			}

			case 'programming.command.pom.cv.read': {
				// Not implemented
				break;
			}

			case 'programming.command.pom.cv.write': {
				// Not implemented
				break;
			}
		}
	}

	/**
	 * Schedule a throttled drive command for a locomotive.
	 * @param addr - Locomotive address
	 */
	private scheduleDrive(addr: number): void {
		if (this.driveTimers.has(addr)) {
			return;
		}

		const timer = setTimeout(() => {
			this.driveTimers.delete(addr);

			const next = this.pendingDrives.get(addr);

			if (!next) {
				return;
			}

			this.pendingDrives.delete(addr);

			this.z21Service.setLocoDrive(addr, next.speed, next.dir);
		}, this.driveThrottleMs);

		this.driveTimers.set(addr, timer);
	}
}
