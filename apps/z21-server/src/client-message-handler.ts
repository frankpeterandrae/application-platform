/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoManager } from '@application-platform/domain';
import { type ClientToServer, type ServerToClient } from '@application-platform/protocol';
import type { Z21Service } from '@application-platform/z21';

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
	 * - trackpower.set: toggles track power and notifies clients
	 * - loco.set: sets locomotive speed and direction, then broadcasts state
	 * - loco.fn: toggles a locomotive function, then broadcasts state
	 * - turnout.set: sets turnout state and notifies clients
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
				this.z21Service.demoPing();
				this.broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns });
				return;
			}

			case 'loco.command.function.set': {
				// Toggle a locomotive function and broadcast the updated locomotive state
				const st = this.locoManager.setFunction(msg.addr, msg.fn, msg.on);
				this.z21Service.demoPing();
				this.broadcast({ type: 'loco.message.state', addr: msg.addr, speed: st.speed, dir: st.dir, fns: st.fns });
				return;
			}

			case 'switching.command.turnout.set': {
				// Update turnout state and notify clients
				this.z21Service.demoPing();
				this.broadcast({ type: 'switching.message.turnout.state', addr: msg.addr, state: msg.state });
				return;
			}
		}
	}
}
