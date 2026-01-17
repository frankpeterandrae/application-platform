/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoManager } from '@application-platform/domain';
import { type ClientToServer, type ServerToClient } from '@application-platform/protocol';
import { LocoFunctionSwitchType, type Z21Service } from '@application-platform/z21';
import { Direction, TurnoutState } from '@application-platform/z21-shared';

/**
 * Function signature used to emit server-to-client protocol messages.
 * @param msg - The message to broadcast to connected clients
 */
export type BroadcastFn = (msg: ServerToClient) => void;

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
	 * @param broadcast - Function to emit server-to-client messages
	 */
	constructor(
		private readonly locoManager: LocoManager,
		private readonly z21Service: Z21Service,
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
	 */
	public handle(msg: ClientToServer): void {
		switch (msg.type) {
			case 'server.command.session.hello':
				// ignore for now
				return;

			case 'system.command.trackpower.set':
				// Ping the Z21 gateway (demo behavior), then broadcast new power state
				this.z21Service.sendTrackPower(msg.on);
				this.broadcast({ type: 'system.message.trackpower', on: msg.on, short: false });
				return;

			case 'loco.command.drive': {
				// Update locomotive speed/direction and inform clients of the new state
				const st = this.locoManager.setSpeed(msg.addr, msg.speed, msg.dir);
				this.pendingDrives.set(msg.addr, { speed: msg.speed, dir: msg.dir });
				this.scheduleDrive(msg.addr);
				this.broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns, estop: st.estop });
				return;
			}

			case 'loco.command.function.set': {
				// Toggle a locomotive function and broadcast the updated locomotive state
				const st = this.locoManager.setFunction(msg.addr, msg.fn, msg.on);
				this.z21Service.setLocoFunction(msg.addr, msg.fn, msg.on ? LocoFunctionSwitchType.On : LocoFunctionSwitchType.Off);
				this.broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns, estop: st.estop });
				return;
			}

			case 'loco.command.function.toggle': {
				// Toggle a locomotive function and broadcast the updated locomotive state
				const st = this.locoManager.setFunction(msg.addr, msg.fn, !(this.locoManager.getState(msg.addr)?.fns[msg.fn] ?? false));
				this.z21Service.setLocoFunction(msg.addr, msg.fn, LocoFunctionSwitchType.Toggle);
				this.broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns, estop: st.estop });
				return;
			}

			case 'loco.command.eStop': {
				// Emergency stop a locomotive and broadcast the updated state
				const t = this.driveTimers.get(msg.addr);
				if (t) {
					clearTimeout(t);
				}

				this.driveTimers.delete(msg.addr);
				this.pendingDrives.delete(msg.addr);
				this.z21Service.setLocoEStop(msg.addr);
				this.z21Service.getLocoInfo(msg.addr);
				return;
			}

			case 'switching.command.turnout.set': {
				// Update turnout state and notify clients
				const port: 0 | 1 = msg.state === TurnoutState.DIVERGING ? 1 : 0;
				this.z21Service.setTurnout(msg.addr, port, { queue: true, pulseMs: msg.pulseMs ?? 100 });
				this.z21Service.getTurnoutInfo(msg.addr);
				return;
			}
		}
	}

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
