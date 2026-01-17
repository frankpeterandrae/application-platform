/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type SystemStateEvent = { type: 'event.system.state'; payload: Z21SystemState };
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
