/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CentralStatus, CentralStatusEx, type DerivedTrackFlags } from '@application-platform/z21-shared';

/**
 * Derives human-friendly track flags from system state bitfields.
 *
 * @param sysState - Central state and extended state bytes.
 * @returns DerivedTrackFlags indicating power, emergency stop, shortCircuit, programming mode.
 */
export function deriveTrackFlagsFromSystemState(sysState: { centralState: number; centralStateEx: number }): DerivedTrackFlags {
	const cs = sysState.centralState;
	const csEx = sysState.centralStateEx;

	const emergencyStop = (cs & CentralStatus.EmergencyStop) !== 0;
	const short = (cs & CentralStatus.ShortCircuit) !== 0;
	const trackVoltageOff = (cs & CentralStatus.TrackVoltageOff) !== 0;
	const powerOn = !trackVoltageOff;
	const programmingMode = (cs & CentralStatus.ProgrammingModeActive) !== 0;

	const highTemperature = (csEx & CentralStatusEx.HighTemperature) !== 0;
	const powerLost = (csEx & CentralStatusEx.PowerLost) !== 0;
	const shortCircuitExternal = (csEx & CentralStatusEx.ShortCircuitExternal) !== 0;
	const shortCircuitInternal = (csEx & CentralStatusEx.ShortCircuitInternal) !== 0;
	const cseRCN2130Mode = (csEx & CentralStatusEx.CseRCN2130Mode) !== 0;

	return {
		powerOn,
		emergencyStop,
		shortCircuit: short,
		programmingMode,
		highTemperature,
		powerLost,
		shortCircuitExternal,
		shortCircuitInternal,
		cseRCN2130Mode
	};
}
