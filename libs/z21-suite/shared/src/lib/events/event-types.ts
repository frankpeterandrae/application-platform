/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LocoInfoEvent } from './loco/loco-info-event';
import { CvNackEvent, CvResultEvent } from './programming';
import { TurnoutInfoEvent } from './switching/turnout-info-event';
import { BroadcastflagEvent } from './system/broadcastflag-event';
import { SystemStateEvent } from './system/system-state-event';
import { TrackPowerEvent } from './system/track-power-event';
import { Z21CodeEvent } from './system/z21-code-event';
import { Z21FirmwareVersionEvent } from './system/z21-firmware-version-event';
import { Z21HwinfoEvent } from './system/z21-hwinfo-event';
import { Z21StatusEvent } from './system/z21-status-event';
import { Z21StoppedEvent } from './system/z21-stopped-event';
import { Z21VersionEvent } from './system/z21-version-event';
import { UnknownLanXEvent } from './unkown/unknown-lan-x-event';
import { UnknownXBusEvent } from './unkown/unknown-x-bus-event';

/**
 * Discrete events derived from Z21 datasets.
 * - system.event.track.power: Track power on/off state
 * - system.event.state: Central station status bitmask
 * - loco.event.info: Locomotive speed/function info
 * - system.event.state: Parsed Z21 system state snapshot
 * - switching.event.turnout.info: Turnout state info
 * - event.unknown.lan_x: Unrecognized LAN-X command for diagnostics
 * - event.unknown.x.bus: Unrecognized X-Bus message for diagnostics
 */
export type Z21Event =
	| BroadcastflagEvent
	| CvNackEvent
	| CvResultEvent
	| LocoInfoEvent
	| SystemStateEvent
	| TrackPowerEvent
	| TurnoutInfoEvent
	| UnknownLanXEvent
	| UnknownXBusEvent
	| Z21CodeEvent
	| Z21FirmwareVersionEvent
	| Z21HwinfoEvent
	| Z21StatusEvent
	| Z21StoppedEvent
	| Z21VersionEvent;

/**
 * Derived flags for track state computed from system state bitfields.
 */
export type DerivedTrackFlags = {
	powerOn?: boolean;
	emergencyStop?: boolean;
	shortCircuit?: boolean;
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
