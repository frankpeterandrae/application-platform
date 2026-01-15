/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { type CsStatus, type LocoInfo, type SystemState, type TrackPower, type UnlonwnXBus } from '@application-platform/z21-shared';

/**
 * Discrete events derived from Z21 datasets.
 * - event.track.power: Track power on/off state
 * - event.cs.status: Central station status bitmask
 * - event.loco.info: Locomotive speed/function info
 * - event.system.state: Parsed Z21 system state snapshot
 * - event.unknown.x.bus: Unrecognized X-Bus payload for diagnostics
 */
export type Z21Event = TrackPower | CsStatus | LocoInfo | SystemState | UnlonwnXBus;

/**
 * Derived flags for track state computed from system state bitfields.
 */
export type DerivedTrackFlags = {
	powerOn?: boolean;
	emergencyStop?: boolean;
	short?: boolean;
	programmingMode?: boolean;
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
