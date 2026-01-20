/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

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
	TurnoutState_Message,
	Z21Rx
} from './index';

describe('Server Message Types', () => {
	describe('SessionReady', () => {
		it('accepts valid server.replay.session.ready message', () => {
			const msg: SessionReady = {
				type: 'server.replay.session.ready',

				protocolVersion: '1.0.0',
				serverTime: '2026-01-08T10:00:00Z'
			};
			expect(msg.type).toBe('server.replay.session.ready');
			expect(msg.protocolVersion).toBe('1.0.0');
			expect(msg.serverTime).toBe('2026-01-08T10:00:00Z');
		});
	});

	describe('SystemTrackPower', () => {
		it('accepts track power on without short', () => {
			const msg: SystemTrackPower = {
				type: 'system.message.trackpower',

				on: true,
				short: false
			};
			expect(msg.on).toBe(true);
			expect(msg.short).toBe(false);
		});

		it('accepts track power off with short', () => {
			const msg: SystemTrackPower = {
				type: 'system.message.trackpower',

				on: false,
				short: true
			};
			expect(msg.on).toBe(false);
			expect(msg.short).toBe(true);
		});

		it('accepts track power with emergency stop', () => {
			const msg: SystemTrackPower = {
				type: 'system.message.trackpower',

				on: false,
				short: false,
				emergencyStop: true
			};
			expect(msg.emergencyStop).toBe(true);
		});
	});

	describe('LocoState', () => {
		it('accepts loco state with speed and direction', () => {
			const msg: LocoState = {
				type: 'loco.message.state',

				addr: 3,
				speed: 50,
				dir: 'FWD',
				fns: { 0: true, 1: false },
				estop: false
			};
			expect(msg.addr).toBe(3);
			expect(msg.speed).toBe(50);
			expect(msg.dir).toBe('FWD');
			expect(msg.fns[0]).toBe(true);
		});

		it('accepts loco state with emergency stop', () => {
			const msg: LocoState = {
				type: 'loco.message.state',

				addr: 1845,
				speed: 0,
				dir: 'FWD',
				fns: {},
				estop: true
			};
			expect(msg.estop).toBe(true);
		});

		it('accepts loco state with multiple functions', () => {
			const msg: LocoState = {
				type: 'loco.message.state',

				addr: 3,
				speed: 0,
				dir: 'REV',
				fns: { 0: true, 1: true, 7: false, 28: true },
				estop: false
			};
			expect(Object.keys(msg.fns).length).toBe(4);
		});
	});

	describe('LocoEStopEvent', () => {
		it('accepts loco emergency stop event', () => {
			const msg: LocoEStopEvent = {
				type: 'loco.message.eStop',
				addr: 1845
			};
			expect(msg.addr).toBe(1845);
		});
	});

	describe('TurnoutState_Message', () => {
		it('accepts turnout state straight', () => {
			const msg: TurnoutState_Message = {
				type: 'switching.message.turnout.state',

				addr: 12,
				state: 'STRAIGHT'
			};
			expect(msg.state).toBe('STRAIGHT');
		});

		it('accepts turnout state diverging', () => {
			const msg: TurnoutState_Message = {
				type: 'switching.message.turnout.state',

				addr: 12,
				state: 'DIVERGING'
			};
			expect(msg.state).toBe('DIVERGING');
		});

		it('accepts turnout state unknown', () => {
			const msg: TurnoutState_Message = {
				type: 'switching.message.turnout.state',

				addr: 12,
				state: 'UNKNOWN'
			};
			expect(msg.state).toBe('UNKNOWN');
		});
	});

	describe('FeedbackChanged', () => {
		it('accepts feedback changed message with source, address and value', () => {
			const msg: FeedbackChanged = {
				type: 'feedback.message.changed',

				source: 'RBUS',
				addr: 1,
				value: 1
			};
			expect(msg.source).toBe('RBUS');
			expect(msg.addr).toBe(1);
			expect(msg.value).toBe(1);
		});

		it('accepts feedback changed with value 0', () => {
			const msg: FeedbackChanged = {
				type: 'feedback.message.changed',

				source: 'CAN',
				addr: 5,
				value: 0
			};
			expect(msg.value).toBe(0);
		});

		it('accepts different source types', () => {
			const rbus: FeedbackChanged = { type: 'feedback.message.changed', source: 'RBUS', addr: 1, value: 1 };
			const can: FeedbackChanged = { type: 'feedback.message.changed', source: 'CAN', addr: 2, value: 0 };
			const loconet: FeedbackChanged = { type: 'feedback.message.changed', source: 'LOCONET', addr: 3, value: 1 };

			expect(rbus.source).toBe('RBUS');
			expect(can.source).toBe('CAN');
			expect(loconet.source).toBe('LOCONET');
		});
	});

	describe('Z21Rx', () => {
		it('accepts z21 rx message with datasets and events', () => {
			const msg: Z21Rx = {
				type: 'system.message.z21.rx',

				rawHex: '0x070040006101',
				datasets: [{ kind: 'ds.x.bus' }],
				events: [{ type: 'event.track.power' }]
			};
			expect(msg.rawHex).toBe('0x070040006101');
			expect(msg.datasets.length).toBe(1);
			expect(msg.events.length).toBe(1);
		});
	});

	describe('SystemVersion', () => {
		it('accepts x-bus version message', () => {
			const msg: SystemVersion = {
				type: 'system.message.x.bus.version',

				version: '1.9',
				cmdsId: 0x12
			};
			expect(msg.version).toBe('1.9');
			expect(msg.cmdsId).toBe(0x12);
		});
	});

	describe('SystemStop', () => {
		it('accepts system stop message', () => {
			const msg: SystemStop = {
				type: 'system.message.stop'
			};
			expect(msg.type).toBe('system.message.stop');
		});
	});

	describe('SystemFirmwareVersion', () => {
		it('accepts firmware version message', () => {
			const msg: SystemFirmwareVersion = {
				type: 'system.message.firmware.version',

				major: 1,
				minor: 43
			};
			expect(msg.major).toBe(1);
			expect(msg.minor).toBe(43);
		});
	});

	describe('SystemHardwareInfo', () => {
		it('accepts hardware info for Z21', () => {
			const msg: SystemHardwareInfo = {
				type: 'system.message.hardware.info',

				hardwareType: 'Z21'
			};
			expect(msg.hardwareType).toBe('Z21');
		});

		it('accepts hardware info for z21_START', () => {
			const msg: SystemHardwareInfo = {
				type: 'system.message.hardware.info',

				hardwareType: 'z21_START'
			};
			expect(msg.hardwareType).toBe('z21_START');
		});
	});

	describe('SystemCode', () => {
		it('accepts system code message', () => {
			const msg: SystemCode = {
				type: 'system.message.z21.code',

				code: 2
			};
			expect(msg.code).toBe(2);
		});
	});

	describe('CV Programming Result Messages', () => {
		it('accepts CV result message', () => {
			const msg: CvResult = {
				type: 'programming.replay.cv.result',
				payload: {
					requestId: 'test-123',
					cvAdress: 29,
					cvValue: 42
				}
			};
			expect(msg.payload.cvAdress).toBe(29);
			expect(msg.payload.cvValue).toBe(42);
		});

		it('accepts CV NACK message', () => {
			const msg: CvNack = {
				type: 'programming.replay.cv.nack',
				payload: {
					requestId: 'test-456',
					error: 'CV programming operation timed out'
				}
			};
			expect(msg.payload.error).toBe('CV programming operation timed out');
		});

		it('accepts CV NACK with different error', () => {
			const msg: CvNack = {
				type: 'programming.replay.cv.nack',
				payload: {
					requestId: 'test-789',
					error: 'Short circuit detected'
				}
			};
			expect(msg.payload.error).toBe('Short circuit detected');
		});
	});
});
