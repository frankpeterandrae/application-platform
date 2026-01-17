/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Import individual types for union definitions
import type { LocoDrive } from './client/loco-drive';
import type { LocoEStop } from './client/loco-estop';
import type { LocoFunctionSet } from './client/loco-function-set';
import type { LocoFunctionToggle } from './client/loco-function-toggle';
import type { SessionHello } from './client/session-hello';
import type { TrackpowerSet } from './client/trackpower-set';
import type { TurnoutSet } from './client/turnout-set';
import type { FeedbackChanged } from './server/feedback-changed';
import type { LocoEStopEvent } from './server/loco-estop-event';
import type { LocoState } from './server/loco-state';
import type { SessionReady } from './server/session-ready';
import type { SystemTrackPower } from './server/system-trackpower';
import type { TurnoutState_Message } from './server/turnout-state';
import type { Z21Rx } from './server/z21-rx';

/**
 * Union of all messages a client may send to the server.
 *
 * When you add a new ClientToServer message type:
 * 1. Import the type
 * 2. Add it to this union
 */
export type ClientToServer = SessionHello | TrackpowerSet | LocoDrive | LocoEStop | LocoFunctionSet | LocoFunctionToggle | TurnoutSet;

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
export type ServerToClient = SessionReady | SystemTrackPower | LocoState | LocoEStopEvent | TurnoutState_Message | FeedbackChanged | Z21Rx;

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
	'system.message.trackpower': true,
	'system.message.z21.rx': true
} as const satisfies Record<ServerToClientType, true>;
