/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Direction = 'FWD' | 'REV';
export type TurnoutState = 'STRAIGHT' | 'DIVERGING';
export type SourceType = 'RBUS' | 'CAN' | 'LOCONET';

/**
 * Union of all messages a client may send to the server.
 *
 * When you add a new ClientToServer message type:
 * 1. Import the type
 * 2. Add it to this union
 */
export type ClientToServer =
	| { type: 'server.command.session.hello'; protocolVersion: string; clientName?: string }
	| { type: 'system.command.trackpower.set'; on: boolean }
	| { type: 'loco.command.drive'; addr: number; speed: number; dir: Direction; steps?: 14 | 28 | 128 }
	| { type: 'loco.command.function.set'; addr: number; fn: number; on: boolean }
	| { type: 'switching.command.turnout.set'; addr: number; state: TurnoutState; pulseMs?: number };

/**
 * Set of all valid ClientToServer message types.
 * Automatically created from the ClientToServerType union.
 * Used for runtime validation in isClientToServerMessage().
 *
 * Note: This requires that all message types in the union have a literal 'type' property.
 */
export type ServerToClient =
	| { type: 'server.replay.session.ready'; protocolVersion: string; serverTime?: string }
	| { type: 'system.message.trackpower'; on: boolean; short?: boolean }
	| { type: 'loco.message.state'; addr: number; speed: number; dir: Direction; fns: Record<number, boolean> }
	| { type: 'switching.message.turnout.state'; addr: number; state: TurnoutState }
	| { type: 'feedback.message.changed'; source: SourceType; addr: number; value: 0 | 1 };
