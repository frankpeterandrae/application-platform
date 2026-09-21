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
	TrackPowerSet,
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
	TurnoutStateMessage,
	Z21Rx
} from './server';

/**
 * Union of all messages accepted from clients.
 *
 * New client message types must also be added to CLIENT_TO_SERVER_TYPES.
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
	| TrackPowerSet
	| TurnoutSet;

type ClientToServerType = ClientToServer['type'];

/**
 * Runtime lookup of supported client-to-server message types.
 *
 * The satisfies constraint ensures that every ClientToServer discriminator
 * is represented at compile time.
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
 * Union of all messages sent from the server to clients.
 *
 * New server message types must also be added to SERVER_TO_CLIENT_TYPES.
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
	| TurnoutStateMessage
	| Z21Rx;

type ServerToClientType = ServerToClient['type'];

/**
 * Runtime lookup of supported server-to-client message types.
 *
 * The satisfies constraint ensures that every ServerToClient discriminator
 * is represented at compile time.
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
 * Supported roles within protocol message type strings.
 */
type RoleType = 'command' | 'replay' | 'message';

/**
 * Constructs a protocol message discriminator in the form
 * `${Domain}.${Role}.${Action}`.
 */
type MessageType<Domain extends string, Role extends RoleType, Action extends string> = `${Domain}.${Role}.${Action}`;

/**
 * Defines a client command message with a mandatory request identifier.
 */
export type CommandMessage<Domain extends string, Action extends string, TPayload = Record<string, unknown>> = {
	type: MessageType<Domain, 'command', Action>;
	payload: Payload<TPayload>;
};

/**
 * Defines a server response associated with a client request.
 */
export type ReplayMessage<Domain extends string, Action extends string, TPayload = Record<string, unknown>> = {
	type: MessageType<Domain, 'replay', Action>;
	payload: Payload<TPayload>;
};

/**
 * Defines an informational server message without an implicit request identifier.
 */
export type Message<Domain extends string, Action extends string, TPayload = Record<string, unknown>> = {
	type: MessageType<Domain, 'message', Action>;
	payload: TPayload;
};

/**
 * Ensures that request-like payloads contain a canonical request identifier.
 */
type Payload<TPayload> = Omit<TPayload, 'requestId'> & {
	requestId: string;
};
