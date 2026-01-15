/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
/**
 * Cardinal direction a locomotive can travel.
 * 'FWD' denotes forward; 'REV' denotes reverse.
 */
export type Direction = 'FWD' | 'REV';

/**
 * Possible turnout (switch) orientations.
 * 'STRAIGHT' routes straight; 'DIVERGING' routes onto a diverging path.
 */
export type TurnoutState = 'STRAIGHT' | 'DIVERGING';

/**
 * Sources that can emit feedback events.
 * 'RBUS', 'CAN', and 'LOCONET' correspond to supported bus types.
 */
export type SourceType = 'RBUS' | 'CAN' | 'LOCONET';

/**
 * Messages a client may send to the server.
 * - server.command.session.hello: announces protocol version and optional client name.
 * - system.command.trackpower.set: toggles track power.
 * - loco.command.drive: sets locomotive speed/direction with optional speed steps.
 * - loco.command.function.set: toggles a locomotive function by number.
 * - switching.command.turnout.set: changes a turnout state with optional pulse duration.
 */
export type ClientToServer =
	| { type: 'server.command.session.hello'; protocolVersion: string; clientName?: string }
	| { type: 'system.command.trackpower.set'; on: boolean }
	| { type: 'loco.command.drive'; addr: number; speed: number; dir: Direction; steps?: 14 | 28 | 128 }
	| { type: 'loco.command.function.set'; addr: number; fn: number; on: boolean }
	| { type: 'switching.command.turnout.set'; addr: number; state: TurnoutState; pulseMs?: number };

/**
 * Messages the server may send to a client.
 * - server.replay.session.ready: confirms readiness and protocol version.
 * - system.message.trackpower: reports power state and optional fault flags.
 * - loco.message.state: reports locomotive speed, direction, and function states.
 * - switching.message.turnout.state: reports turnout position.
 * - feedback.message.changed: reports a feedback sensor change from a given source.
 * - system.message.z21.rx: forwards raw Z21 datasets/events with hex payload.
 */
export type ServerToClient =
	| { type: 'server.replay.session.ready'; protocolVersion: string; serverTime?: string }
	| { type: 'system.message.trackpower'; on: boolean; short?: boolean; emergencyStop?: boolean }
	| { type: 'loco.message.state'; addr: number; speed: number; dir: Direction; fns: Record<number, boolean> }
	| { type: 'switching.message.turnout.state'; addr: number; state: TurnoutState }
	| { type: 'feedback.message.changed'; source: SourceType; addr: number; value: 0 | 1 }
	| { type: 'system.message.z21.rx'; datasets: unknown[]; events: unknown[]; rawHex: string };
