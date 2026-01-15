/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Discrete events derived from Z21 datasets.
 * - track.power: Track power on/off state
 * - cs.status: Central station status bitmask
 * - loco.info: Locomotive speed/function info
 * - system.state: Parsed Z21 system state snapshot
 * - unknown.x.bus: Unrecognized X-Bus payload for diagnostics
 */
export type Z21Event =
	| { type: 'event.track.power'; on: boolean }
	| { type: 'event.system.state'; statusMask: number }
	| { type: 'event.loco.info'; addr: number; speedSteps: 14 | 28 | 128; speedRaw: number; forward: boolean }
	| { type: 'event.z21.status'; payload: Z21SystemState }
	| { type: 'event.unknown.x.bus'; xHeader: number; bytes: number[] };
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
