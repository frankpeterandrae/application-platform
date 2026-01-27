/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { DerivedTrackFlags } from '@application-platform/z21-shared';

import { deriveTrackFlagsFromSystemState } from './derive-track-flags';

describe('deriveTrackFlagsFromSystemState', () => {
	// Helper function to create state input (similar to makeProviders in bootstrap.spec.ts)
	function makeState(centralState: number, centralStateEx: number): { centralState: number; centralStateEx: number } {
		return { centralState, centralStateEx };
	}

	// Helper function to derive flags from state
	function deriveFlags(centralState: number, centralStateEx: number): DerivedTrackFlags {
		return deriveTrackFlagsFromSystemState(makeState(centralState, centralStateEx));
	}

	// Helper function to verify complete flags structure
	function expectFlags(result: DerivedTrackFlags, expected: Partial<DerivedTrackFlags>): void {
		expect(result).toMatchObject(expected);
	}

	// Helper function to verify central state flags (basic operation)
	function expectCentralFlags(
		result: DerivedTrackFlags,
		checks: {
			powerOn?: boolean;
			emergencyStop?: boolean;
			shortCircuit?: boolean;
			programmingMode?: boolean;
		}
	): void {
		if (checks.powerOn !== undefined) expect(result.powerOn).toBe(checks.powerOn);
		if (checks.emergencyStop !== undefined) expect(result.emergencyStop).toBe(checks.emergencyStop);
		if (checks.shortCircuit !== undefined) expect(result.shortCircuit).toBe(checks.shortCircuit);
		if (checks.programmingMode !== undefined) expect(result.programmingMode).toBe(checks.programmingMode);
	}

	// Helper function to verify extended state flags (system health)
	function expectExtendedFlags(
		result: DerivedTrackFlags,
		checks: {
			highTemperature?: boolean;
			powerLost?: boolean;
			shortCircuitExternal?: boolean;
			shortCircuitInternal?: boolean;
			cseRCN2130Mode?: boolean;
		}
	): void {
		if (checks.highTemperature !== undefined) expect(result.highTemperature).toBe(checks.highTemperature);
		if (checks.powerLost !== undefined) expect(result.powerLost).toBe(checks.powerLost);
		if (checks.shortCircuitExternal !== undefined) expect(result.shortCircuitExternal).toBe(checks.shortCircuitExternal);
		if (checks.shortCircuitInternal !== undefined) expect(result.shortCircuitInternal).toBe(checks.shortCircuitInternal);
		if (checks.cseRCN2130Mode !== undefined) expect(result.cseRCN2130Mode).toBe(checks.cseRCN2130Mode);
	}

	beforeEach(() => {
		// No mocks to reset for pure functions, but keeping pattern consistent with bootstrap.spec.ts
		resetMocksBeforeEach({});
	});

	describe('central state flags (basic operation)', () => {
		it('sets powerOn when track voltage is on', () => {
			const flags = deriveFlags(0x00, 0x00);

			expectCentralFlags(flags, {
				powerOn: true,
				emergencyStop: false,
				shortCircuit: false,
				programmingMode: false
			});
		});

		it('sets powerOff when track voltage flag is present', () => {
			const flags = deriveFlags(0x02, 0x00);

			expectCentralFlags(flags, {
				powerOn: false,
				emergencyStop: false,
				shortCircuit: false
			});
		});

		it('detects emergency stop flag when set', () => {
			const flags = deriveFlags(0x01, 0x00);

			expectCentralFlags(flags, {
				emergencyStop: true,
				powerOn: true,
				shortCircuit: false
			});
		});

		it('detects shortCircuit circuit flag', () => {
			const flags = deriveFlags(0x06, 0x00);

			expectCentralFlags(flags, {
				powerOn: false,
				emergencyStop: false,
				shortCircuit: true
			});
		});

		it('detects programming mode active', () => {
			const flags = deriveFlags(0x20, 0x00);

			expect(flags.programmingMode).toBe(true);
		});
	});

	describe('extended state flags (system health)', () => {
		it('detects high temperature flag', () => {
			const flags = deriveFlags(0x00, 0x01);

			expectExtendedFlags(flags, {
				highTemperature: true,
				powerLost: false,
				shortCircuitExternal: false,
				shortCircuitInternal: false
			});
		});

		it('detects power lost flag', () => {
			const flags = deriveFlags(0x00, 0x02);

			expectExtendedFlags(flags, {
				powerLost: true,
				highTemperature: false
			});
		});

		it('detects external shortCircuit circuit flag', () => {
			const flags = deriveFlags(0x00, 0x04);

			expectExtendedFlags(flags, {
				shortCircuitExternal: true,
				shortCircuitInternal: false
			});
		});

		it('detects internal shortCircuit circuit flag', () => {
			const flags = deriveFlags(0x00, 0x08);

			expectExtendedFlags(flags, {
				shortCircuitInternal: true,
				shortCircuitExternal: false
			});
		});

		it('detects CSE RCN-213 mode flag', () => {
			const flags = deriveFlags(0x00, 0x20);

			expect(flags.cseRCN2130Mode).toBe(true);
		});
	});

	describe('combined flags', () => {
		it('detects multiple central status flags simultaneously', () => {
			const flags = deriveFlags(0x07, 0x00);

			expectFlags(flags, {
				emergencyStop: true,
				powerOn: false,
				shortCircuit: true
			});
		});

		it('detects multiple extended status flags simultaneously', () => {
			const flags = deriveFlags(0x00, 0x0f);

			expectFlags(flags, {
				highTemperature: true,
				powerLost: true,
				shortCircuitExternal: true,
				shortCircuitInternal: true
			});
		});

		it('detects all central and extended status flags combined', () => {
			const flags = deriveFlags(0x27, 0x2f);

			expectFlags(flags, {
				emergencyStop: true,
				powerOn: false,
				shortCircuit: true,
				programmingMode: true,
				highTemperature: true,
				powerLost: true,
				shortCircuitExternal: true,
				shortCircuitInternal: true,
				cseRCN2130Mode: true
			});
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same input', () => {
			const state = makeState(0x27, 0x2f);

			const flags1 = deriveTrackFlagsFromSystemState(state);
			const flags2 = deriveTrackFlagsFromSystemState(state);

			expect(flags1).toEqual(flags2);
		});

		it('produces different output for different central states', () => {
			const flags1 = deriveFlags(0x00, 0x00);
			const flags2 = deriveFlags(0x01, 0x00);

			expect(flags1.emergencyStop).not.toBe(flags2.emergencyStop);
		});

		it('produces different output for different extended states', () => {
			const flags1 = deriveFlags(0x00, 0x00);
			const flags2 = deriveFlags(0x00, 0x01);

			expect(flags1.highTemperature).not.toBe(flags2.highTemperature);
		});
	});

	describe('edge cases', () => {
		it('handles all flags disabled (normal operation)', () => {
			const flags = deriveFlags(0x00, 0x00);

			expectCentralFlags(flags, {
				powerOn: true,
				emergencyStop: false,
				shortCircuit: false,
				programmingMode: false
			});
			expectExtendedFlags(flags, {
				highTemperature: false,
				powerLost: false,
				shortCircuitExternal: false,
				shortCircuitInternal: false,
				cseRCN2130Mode: false
			});
		});

		it('handles all flags enabled (critical system state)', () => {
			const flags = deriveFlags(0xff, 0xff);

			expect(flags.emergencyStop).toBe(true);
			expect(flags.shortCircuit).toBe(true);
			expect(flags.programmingMode).toBe(true);
			expect(flags.highTemperature).toBe(true);
			expect(flags.powerLost).toBe(true);
			expect(flags.shortCircuitExternal).toBe(true);
			expect(flags.shortCircuitInternal).toBe(true);
			expect(flags.cseRCN2130Mode).toBe(true);
		});

		it('handles only programming mode flag', () => {
			const flags = deriveFlags(0x20, 0x00);

			expect(flags.programmingMode).toBe(true);
			expect(flags.powerOn).toBe(true);
			expect(flags.emergencyStop).toBe(false);
			expect(flags.shortCircuit).toBe(false);
		});

		it('handles only CSE RCN-213 mode flag', () => {
			const flags = deriveFlags(0x00, 0x20);

			expect(flags.cseRCN2130Mode).toBe(true);
			expect(flags.highTemperature).toBe(false);
			expect(flags.powerLost).toBe(false);
		});
	});
});
