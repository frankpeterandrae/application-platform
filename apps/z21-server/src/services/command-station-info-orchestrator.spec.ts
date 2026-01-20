/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommandStationInfo } from '@application-platform/domain';
import { DeepMocked, Mock, resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { Z21CommandService } from '@application-platform/z21';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandStationInfoOrchestrator } from './command-station-info-orchestrator';

describe('CommandStationInfoOrchestrator', () => {
	let orchestrator: CommandStationInfoOrchestrator;
	let commandStationInfo: DeepMocked<CommandStationInfo>;
	let z21CommandService: DeepMocked<Z21CommandService>;

	beforeEach(() => {
		vi.useFakeTimers();

		commandStationInfo = Mock<CommandStationInfo>();
		z21CommandService = Mock<Z21CommandService>();

		// Clear mock history
		resetMocksBeforeEach({ commandStationInfo, z21CommandService });

		// Configure default mock return values
		commandStationInfo.hasFirmwareVersion.mockReturnValue(false);
		commandStationInfo.hasXBusVersion.mockReturnValue(false);
		commandStationInfo.hasHardwareType.mockReturnValue(false);
		commandStationInfo.hasCode.mockReturnValue(false);

		orchestrator = new CommandStationInfoOrchestrator(commandStationInfo as any, z21CommandService as any);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('poke firmware version', () => {
		it('requests firmware version when not cached', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(1);
		});

		it('does not request firmware version when already cached', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });

			// Initialize mock before checking
			(z21CommandService.getFirmwareVersion as vi.Mock).mockClear();

			orchestrator.poke();

			expect(z21CommandService.getFirmwareVersion).not.toHaveBeenCalled();
		});

		it('does not request firmware version again when request is in flight', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();

			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(1);
		});

		it('retries firmware version request after timeout', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			orchestrator.poke();
			vi.advanceTimersByTime(1001);
			orchestrator.poke();

			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(2);
		});

		it('stops retrying firmware version after ack', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.ack('firmware');
			vi.advanceTimersByTime(1001);
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			orchestrator.poke();

			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(1);
		});
	});

	describe('poke hardware info with firmware >= 1.20', () => {
		beforeEach(() => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
		});

		it('requests hardware info when firmware >= 1.20 and hardware not cached', () => {
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(1);
		});

		it('does not request hardware info when already cached', () => {
			commandStationInfo.hasHardwareType.mockReturnValue(true);

			// Initialize mock before checking
			(z21CommandService.getHardwareInfo as vi.Mock).mockClear();

			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).not.toHaveBeenCalled();
		});

		it('requests hardware info when firmware version is 2.0', () => {
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 2, minor: 0 });
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(1);
		});

		it('does not request hardware info again when request is in flight', () => {
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(1);
		});

		it('retries hardware info request after timeout', () => {
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			orchestrator.poke();
			vi.advanceTimersByTime(1001);
			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(2);
		});
	});

	describe('poke xBusVersion with firmware < 1.20', () => {
		beforeEach(() => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 19 });
		});

		it('requests xBusVersion when firmware < 1.20 and not cached', () => {
			commandStationInfo.hasXBusVersion.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(1);
		});

		it('does not request xBusVersion when already cached', () => {
			commandStationInfo.hasXBusVersion.mockReturnValue(true);

			// Initialize mock before checking
			(z21CommandService.getXBusVersion as vi.Mock).mockClear();

			orchestrator.poke();

			expect(z21CommandService.getXBusVersion).not.toHaveBeenCalled();
		});

		it('does not request hardware info when firmware < 1.20', () => {
			commandStationInfo.hasXBusVersion.mockReturnValue(false);

			// Initialize mock before checking
			(z21CommandService.getHardwareInfo as vi.Mock).mockClear();

			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).not.toHaveBeenCalled();
		});

		it('requests xBusVersion when firmware version is 1.0', () => {
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 0 });
			commandStationInfo.hasXBusVersion.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(1);
		});

		it('does not request xBusVersion again when request is in flight', () => {
			commandStationInfo.hasXBusVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();

			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(1);
		});
	});

	describe('poke code for z21_START and z21_SMALL', () => {
		beforeEach(() => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(true);
		});

		it('requests code when hardware is z21_START and code not cached', () => {
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getCode).toHaveBeenCalledTimes(1);
		});

		it('requests code when hardware is z21_SMALL and code not cached', () => {
			commandStationInfo.getHardwareType.mockReturnValue('z21_SMALL');
			commandStationInfo.hasCode.mockReturnValue(false);

			orchestrator.poke();

			expect(z21CommandService.getCode).toHaveBeenCalledTimes(1);
		});

		it('does not request code when hardware is Z21_XL', () => {
			commandStationInfo.getHardwareType.mockReturnValue('Z21_XL');
			commandStationInfo.hasCode.mockReturnValue(false);

			// Initialize mock before checking
			(z21CommandService.getCode as vi.Mock).mockClear();

			orchestrator.poke();

			expect(z21CommandService.getCode).not.toHaveBeenCalled();
		});

		it('does not request code when already cached', () => {
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(true);

			// Initialize mock before checking
			(z21CommandService.getCode as vi.Mock).mockClear();

			orchestrator.poke();

			expect(z21CommandService.getCode).not.toHaveBeenCalled();
		});

		it('does not request code again when request is in flight', () => {
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();

			expect(z21CommandService.getCode).toHaveBeenCalledTimes(1);
		});

		it('retries code request after timeout', () => {
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(false);

			orchestrator.poke();
			vi.advanceTimersByTime(1001);
			orchestrator.poke();

			expect(z21CommandService.getCode).toHaveBeenCalledTimes(2);
		});
	});

	describe('ack', () => {
		it('allows firmware version request to be sent again after ack', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();
			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(1);

			orchestrator.ack('firmware');
			orchestrator.poke();
			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(2);
		});

		it('allows xBusVersion request to be sent again after ack', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 0 });
			commandStationInfo.hasXBusVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();
			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(1);

			orchestrator.ack('xbusVersion');
			orchestrator.poke();
			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(2);
		});

		it('allows hwinfo request to be sent again after ack', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();
			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(1);

			orchestrator.ack('hwinfo');
			orchestrator.poke();
			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(2);
		});

		it('allows code request to be sent again after ack', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(true);
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.poke();
			expect(z21CommandService.getCode).toHaveBeenCalledTimes(1);

			orchestrator.ack('code');
			orchestrator.poke();
			expect(z21CommandService.getCode).toHaveBeenCalledTimes(2);
		});
	});

	describe('reset', () => {
		it('resets firmware request state', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.reset();
			orchestrator.poke();

			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(2);
		});

		it('resets xBusVersion request state', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 0 });
			commandStationInfo.hasXBusVersion.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.reset();
			orchestrator.poke();

			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(2);
		});

		it('resets hwinfo request state', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.reset();
			orchestrator.poke();

			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(2);
		});

		it('resets code request state', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(true);
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(false);

			orchestrator.poke();
			orchestrator.reset();
			orchestrator.poke();

			expect(z21CommandService.getCode).toHaveBeenCalledTimes(2);
		});
	});

	describe('request sequencing', () => {
		it('requests firmware first, then hardware info', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			// Initialize mock before checking
			(z21CommandService.getHardwareInfo as vi.Mock).mockClear();

			orchestrator.poke();
			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(1);
			expect(z21CommandService.getHardwareInfo).not.toHaveBeenCalled();

			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(false);
			orchestrator.ack('firmware');
			orchestrator.poke();
			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(1);
		});

		it('requests firmware first, then xBusVersion for old firmware', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			// Initialize mock before checking
			(z21CommandService.getXBusVersion as vi.Mock).mockClear();

			orchestrator.poke();
			expect(z21CommandService.getFirmwareVersion).toHaveBeenCalledTimes(1);
			expect(z21CommandService.getXBusVersion).not.toHaveBeenCalled();

			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 0 });
			commandStationInfo.hasXBusVersion.mockReturnValue(false);
			orchestrator.ack('firmware');
			orchestrator.poke();
			expect(z21CommandService.getXBusVersion).toHaveBeenCalledTimes(1);
		});

		it('requests hardware info, then code for z21_START', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			// Initialize mock before checking
			(z21CommandService.getCode as vi.Mock).mockClear();

			orchestrator.poke();
			expect(z21CommandService.getHardwareInfo).toHaveBeenCalledTimes(1);
			expect(z21CommandService.getCode).not.toHaveBeenCalled();

			commandStationInfo.hasHardwareType.mockReturnValue(true);
			commandStationInfo.getHardwareType.mockReturnValue('z21_START');
			commandStationInfo.hasCode.mockReturnValue(false);
			orchestrator.ack('hwinfo');
			orchestrator.poke();
			expect(z21CommandService.getCode).toHaveBeenCalledTimes(1);
		});

		it('stops poke when firmware not available', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(false);

			// Initialize mocks before checking
			(z21CommandService.getXBusVersion as vi.Mock).mockClear();
			(z21CommandService.getHardwareInfo as vi.Mock).mockClear();
			(z21CommandService.getCode as vi.Mock).mockClear();

			orchestrator.poke();
			orchestrator.ack('firmware');
			orchestrator.poke();

			expect(z21CommandService.getXBusVersion).not.toHaveBeenCalled();
			expect(z21CommandService.getHardwareInfo).not.toHaveBeenCalled();
			expect(z21CommandService.getCode).not.toHaveBeenCalled();
		});

		it('stops poke when hardware type not available', () => {
			commandStationInfo.hasFirmwareVersion.mockReturnValue(true);
			commandStationInfo.getFirmwareVersion.mockReturnValue({ major: 1, minor: 20 });
			commandStationInfo.hasHardwareType.mockReturnValue(false);

			// Initialize mock before checking
			(z21CommandService.getCode as vi.Mock).mockClear();

			orchestrator.poke();
			orchestrator.ack('hwinfo');
			orchestrator.poke();

			expect(z21CommandService.getCode).not.toHaveBeenCalled();
		});
	});
});
