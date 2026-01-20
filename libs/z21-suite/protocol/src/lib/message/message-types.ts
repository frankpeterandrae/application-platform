/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type {
	CvRead,
	CvWrite,
	LocoDrive,
	LocoEStop,
	LocoFunctionSet,
	LocoFunctionToggle,
	PomCvRead,
	PomCvWrite,
	SessionHello,
	StopAll,
	TrackpowerSet,
	TurnoutSet
} from './client';
import type {
	CvNack,
	CvResult,
	FeedbackChanged,
	LocoEStopEvent,
	LocoState,
	SessionReady,
	SystemCode,
	SystemFirmwareVersion,
	SystemHardwareInfo,
	SystemStop,
	SystemTrackPower,
	SystemVersion,
	TurnoutState_Message,
	Z21Rx
} from './server';

/**
 * Union of all messages a client may send to the server.
 *
 * When you add a new ClientToServer message type:
 * 1. Import the type
 * 2. Add it to this union
 */
export type ClientToServer =
	| CvRead
	| CvWrite
	| LocoDrive
	| LocoEStop
	| LocoFunctionSet
	| LocoFunctionToggle
	| PomCvRead
	| PomCvWrite
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
	'programming.command.cv.read': true,
	'programming.command.cv.write': true,
	'programming.command.pom.cv.read': true,
	'programming.command.pom.cv.write': true,
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
	| CvNack
	| CvResult
	| FeedbackChanged
	| LocoEStopEvent
	| LocoState
	| SessionReady
	| SystemCode
	| SystemFirmwareVersion
	| SystemHardwareInfo
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
	'programming.replay.cv.nack': true,
	'programming.replay.cv.result': true,
	'server.replay.session.ready': true,
	'switching.message.turnout.state': true,
	'system.message.firmware.version': true,
	'system.message.hardware.info': true,
	'system.message.stop': true,
	'system.message.trackpower': true,
	'system.message.x.bus.version': true,
	'system.message.z21.code': true,
	'system.message.z21.rx': true
} as const satisfies Record<ServerToClientType, true>;

/**
 * Role names used when composing typed message strings via `MessageType`.
 *
 * 'command' — request from UI/client that triggers an action.
 * 'replay'  — responses/results produced by the server (replays of commands).
 * 'message' — informational messages (not necessarily request/response).
 */
type RoleType = 'command' | 'replay' | 'message';

/**
 * Template type for message type strings.
 *
 * Produces strings of the form: `${Domain}.${Role}.${Action}`
 * Example: `programming.command.cv.read`
 */
type MessageType<Domain extends string, Role extends RoleType, Action extends string> = `${Domain}.${Role}.${Action}`;

/**
 * CommandMessage helper type.
 *
 * Use when building a command message type whose `type` is `${Domain}.command.${Action}`.
 * The `payload` is normalized via `Payload<TPayload>` so `requestId` is enforced.
 *
 * Example:
 *   type CvReadMsg = CommandMessage<'programming', 'cv.read', { cvAddress: number }>;
 *   // -> { type: 'programming.command.cv.read', payload: { requestId: string, cvAddress: number } }
 */
export type CommandMessage<Domain extends string, Action extends string, TPayload = Record<string, unknown>> = {
	type: MessageType<Domain, 'command', Action>;
	payload: Payload<TPayload>;
};

/**
 * ReplayMessage helper type.
 *
 * Use when the server publishes a replay/result message with type `${Domain}.replay.${Action}`.
 * The `payload` is normalized via `Payload<TPayload>` so `requestId` is enforced.
 */
export type ReplayMessage<Domain extends string, Action extends string, TPayload = Record<string, unknown>> = {
	type: MessageType<Domain, 'replay', Action>;
	payload: Payload<TPayload>;
};

/**
 * Generic informational Message type.
 *
 * Produces `${Domain}.message.${Action}` as the type string. This variant intentionally
 * leaves `payload` as `TPayload` (no automatic `requestId` injection) because not all
 * informational messages are request-like.
 *
 * For messages that should include `requestId`, prefer `CommandMessage` or `ReplayMessage`.
 */
export type Message<Domain extends string, Action extends string, TPayload = Record<string, unknown>> = {
	type: MessageType<Domain, 'message', Action>;
	payload: TPayload;
};

/**
 * Payload<TPayload>
 *
 * Ensures that any request-like payload always includes a `requestId: string`.
 *
 * Implementation detail:
 * - `Omit<TPayload, 'requestId'>` removes any `requestId` declaration from `TPayload`
 *   (prevents conflicts such as `number & string`).
 * - `& { requestId: string }` then enforces the canonical `requestId: string` type.
 *
 * Result:
 * - If `TPayload` does not include `requestId`, payload becomes `{ requestId: string } & TPayload`.
 * - If `TPayload` included `requestId` with a different type, that field is replaced
 *   with `requestId: string`, avoiding incompatible intersections.
 */
type Payload<TPayload> = Omit<TPayload, 'requestId'> & {
	requestId: string;
};
