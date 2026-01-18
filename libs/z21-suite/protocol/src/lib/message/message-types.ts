/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Import individual types for union definitions
import type { LocoDrive, LocoEStop, LocoFunctionSet, LocoFunctionToggle, SessionHello, StopAll, TrackpowerSet, TurnoutSet } from './client';
import type {
	FeedbackChanged,
	LocoEStopEvent,
	LocoState,
	SessionReady,
	SystemFirmwareVersion,
	SystemTrackPower,
	SystemVersion,
	TurnoutState_Message,
	Z21Rx
} from './server';
import { SystemStop } from './server';
/**
 * Union of all messages a client may send to the server.
 *
 * When you add a new ClientToServer message type:
 * 1. Import the type
 * 2. Add it to this union
 */
export type ClientToServer =
	| LocoDrive
	| LocoEStop
	| LocoFunctionSet
	| LocoFunctionToggle
	| SessionHello
	| StopAll
	| TrackpowerSet
	| TurnoutSet;

type ClientToServerType = ClientToServer['type'];

/**
 * Set of all valid ClientToServer message types.
 * Automatically created from the ClientToServerType union.
 * Used for runtime validation in isClientToServerMessage().
 *
 * Note: This requires that all message types in the union have a literal 'type' property.
 */
export const CLIENT_TO_SERVER_TYPES = {
	'loco.command.drive': true,
	'loco.command.eStop': true,
	'loco.command.function.set': true,
	'loco.command.function.toggle': true,
	'loco.command.stop.all': true,
	'server.command.session.hello': true,
	'switching.command.turnout.set': true,
	'system.command.trackpower.set': true
} as const satisfies Record<ClientToServerType, true>;

/**
 * Union of all messages the server may send to a client.
 *
 * When you add a new ServerToClient message type:
 * 1. Import the type
 * 2. Add it to this union
 */
export type ServerToClient =
	| FeedbackChanged
	| LocoEStopEvent
	| LocoState
	| SessionReady
	| SystemFirmwareVersion
	| SystemStop
	| SystemTrackPower
	| SystemVersion
	| TurnoutState_Message
	| Z21Rx;

type ServerToClientType = ServerToClient['type'];
/**
 * Set of all valid ServerToClient message types.
 * Automatically created from the ServerToClientType union.
 * Used for runtime validation in isServerToClientMessage().
 *
 * Note: This requires that all message types in the union have a literal 'type' property.
 */
export const SERVER_TO_CLIENT_TYPES = {
	'feedback.message.changed': true,
	'loco.message.eStop': true,
	'loco.message.state': true,
	'server.replay.session.ready': true,
	'switching.message.turnout.state': true,
	'system.message.firmware.version': true,
	'system.message.stop': true,
	'system.message.trackpower': true,
	'system.message.x.bus.version': true,
	'system.message.z21.rx': true
} as const satisfies Record<ServerToClientType, true>;
