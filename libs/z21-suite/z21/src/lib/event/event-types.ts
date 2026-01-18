/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import {
	LocoInfoEvent,
	SystemStateEvent,
	TrackPowerEvent,
	TurnoutInfoEvent,
	UnknownLanXEvent,
	UnknownXBusEvent,
	Z21FirmwareVersionEvent,
	Z21StatusEvent,
	Z21StoppedEvent,
	Z21VersionEvent
} from '@application-platform/z21-shared';

/**
 * Discrete events derived from Z21 datasets.
 * - event.track.power: Track power on/off state
 * - event.system.state: Central station status bitmask
 * - event.loco.info: Locomotive speed/function info
 * - event.system.state: Parsed Z21 system state snapshot
 * - event.turnout.info: Turnout state info
 * - event.unknown.lan_x: Unrecognized LAN-X command for diagnostics
 * - event.unknown.x.bus: Unrecognized X-Bus message for diagnostics
 */
export type Z21Event =
	| LocoInfoEvent
	| SystemStateEvent
	| TrackPowerEvent
	| TurnoutInfoEvent
	| UnknownLanXEvent
	| UnknownXBusEvent
	| Z21FirmwareVersionEvent
	| Z21StatusEvent
	| Z21StoppedEvent
	| Z21VersionEvent;

/**
 * Derived flags for track state computed from system state bitfields.
 */
export type DerivedTrackFlags = {
	powerOn?: boolean;
	emergencyStop?: boolean;
	short?: boolean;
	programmingMode?: boolean;
	highTemperature?: boolean;
	powerLost?: boolean;
	shortCircuitExternal?: boolean;
	shortCircuitInternal?: boolean;
	cseRCN2130Mode?: boolean;
};

/**
 * Bit flags for Z21 central status.
 */
export const enum CentralStatus {
	EmergencyStop = 0x01,
	TrackVoltageOff = 0x02,
	ShortCircuit = 0x04,
	ProgrammingModeActive = 0x20
}

/**
 * Bit flags for Z21 extended central status.
 */
export const enum CentralStatusEx {
	HighTemperature = 0x01,
	PowerLost = 0x02,
	ShortCircuitExternal = 0x04,
	ShortCircuitInternal = 0x08,
	CseRCN2130Mode = 0x20
}
