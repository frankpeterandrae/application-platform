/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { type LanXCommandKey } from './lan-x-types';

/**
 * Cardinal direction a locomotive can travel.
 * 'FWD' denotes forward; 'REV' denotes reverse.
 */
export const Direction = {
	FWD: 'FWD',
	REV: 'REV'
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

/**
 * Z21 protocol message types for various functionalities.
 */
export type TrackPower = { type: 'event.track.power'; on: boolean; emergencyStop?: boolean };

/**
 * Derived track flags indicating power status.
 */
export type CsStatus = { type: 'event.system.state'; statusMask: number };

/**
 * Derived track flags from system state.
 */
export type LocoInfo = {
	type: 'event.loco.info';
	addr: number;
	speedSteps: 14 | 28 | 128;
	speed: number;
	emergencyStop: boolean;
	direction: Direction;
	isMmLoco: boolean;
	isOccupied: boolean;
	isDoubleTraction: boolean;
	isSmartsearch: boolean;
	functionMap: Record<number, boolean>;
};

/**
 * Z21 system state message containing various telemetry data.
 */
export type SystemState = { type: 'event.z21.status'; payload: Z21SystemState };

/**
 * Unknown X-Bus message with header and raw byte data.
 */
export type UnlonwnXBus = { type: 'event.unknown.x.bus'; xHeader: number; bytes: number[] };

/**
 * Unknown LAN X message with command key and raw byte data.
 */
export type UnknownLanX = { type: 'event.unknown.lan_x'; command: LanXCommandKey; bytes: number[] };

/**
 * Turnout information message indicating the state of a turnout.
 */
export type TurnoutInfo = { type: 'event.turnout.info'; addr: number; state: TurnoutState };

/**
 * Parsed Z21 system state fields, as defined by the protocol.
 */
export type Z21SystemState = {
	mainCurrent_mA: number; // int16
	progCurrent_mA: number; // int16
	filteredMainCurrent_mA: number; // int16
	temperature_C: number; // int16
	supplyVoltage_mV: number; // uint16
	vccVoltage_mV: number; // uint16
	centralState: number; // uint8 (Bitfeld)
	centralStateEx: number; // uint8 (Bitfeld)
	capabilities: number; // uint8
};

export const TurnoutState = {
	STRAIGHT: 'STRAIGHT',
	DIVERGING: 'DIVERGING',
	UNKNOWN: 'UNKNOWN'
};
export type TurnoutState = (typeof TurnoutState)[keyof typeof TurnoutState];
