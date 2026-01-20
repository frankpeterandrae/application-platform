/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoDrive } from './loco-drive';
import type { LocoEStop } from './loco-estop';
import type { LocoFunctionSet } from './loco-function-set';
import type { LocoFunctionToggle } from './loco-function-toggle';
import type { CvRead } from './programming/cv-read';
import type { CvWrite } from './programming/cv-write';
import type { PomCvRead } from './programming/pom-cv-read';
import type { PomCvWrite } from './programming/pom-cv-write';
import type { SessionHello } from './session-hello';
import type { StopAll } from './stop-all';
import type { TrackpowerSet } from './trackpower-set';
import type { TurnoutSet } from './turnout-set';

describe('Client Message Types', () => {
	describe('SessionHello', () => {
		it('accepts valid server.command.session.hello message', () => {
			const msg: SessionHello = {
				type: 'server.command.session.hello',
				protocolVersion: '1.0.0'
			};
			expect(msg.type).toBe('server.command.session.hello');
			expect(msg.protocolVersion).toBe('1.0.0');
		});

		it('accepts server.command.session.hello with different protocol version', () => {
			const msg: SessionHello = {
				type: 'server.command.session.hello',
				protocolVersion: '2.1.0'
			};
			expect(msg.protocolVersion).toBe('2.1.0');
		});
	});

	describe('TrackpowerSet', () => {
		it('accepts trackpower on message', () => {
			const msg: TrackpowerSet = {
				type: 'system.command.trackpower.set',

				on: true
			};
			expect(msg.on).toBe(true);
		});

		it('accepts trackpower off message', () => {
			const msg: TrackpowerSet = {
				type: 'system.command.trackpower.set',

				on: false
			};
			expect(msg.on).toBe(false);
		});
	});

	describe('LocoDrive', () => {
		it('accepts valid loco drive message with forward direction', () => {
			const msg: LocoDrive = {
				type: 'loco.command.drive',

				addr: 3,
				speed: 50,
				dir: 'FWD',
				steps: 128
			};
			expect(msg.addr).toBe(3);
			expect(msg.speed).toBe(50);
			expect(msg.dir).toBe('FWD');
			expect(msg.steps).toBe(128);
		});

		it('accepts loco drive with reverse direction', () => {
			const msg: LocoDrive = {
				type: 'loco.command.drive',

				addr: 1845,
				speed: 0,
				dir: 'REV',
				steps: 28
			};
			expect(msg.dir).toBe('REV');
		});

		it('accepts different speed steps values', () => {
			const msg14: LocoDrive = {
				type: 'loco.command.drive',
				addr: 1,
				speed: 0,
				dir: 'FWD',
				steps: 14
			};
			const msg28: LocoDrive = {
				type: 'loco.command.drive',
				addr: 1,
				speed: 0,
				dir: 'FWD',
				steps: 28
			};
			const msg128: LocoDrive = {
				type: 'loco.command.drive',
				addr: 1,
				speed: 0,
				dir: 'FWD',
				steps: 128
			};

			expect(msg14.steps).toBe(14);
			expect(msg28.steps).toBe(28);
			expect(msg128.steps).toBe(128);
		});
	});

	describe('LocoFunctionSet', () => {
		it('accepts function set on', () => {
			const msg: LocoFunctionSet = {
				type: 'loco.command.function.set',

				addr: 3,
				fn: 0,
				on: true
			};
			expect(msg.fn).toBe(0);
			expect(msg.on).toBe(true);
		});

		it('accepts function set off', () => {
			const msg: LocoFunctionSet = {
				type: 'loco.command.function.set',

				addr: 3,
				fn: 7,
				on: false
			};
			expect(msg.fn).toBe(7);
			expect(msg.on).toBe(false);
		});

		it('accepts different function numbers', () => {
			const fn0: LocoFunctionSet = { type: 'loco.command.function.set', addr: 1, fn: 0, on: true };
			const fn28: LocoFunctionSet = {
				type: 'loco.command.function.set',
				addr: 1,
				fn: 28,
				on: true
			};

			expect(fn0.fn).toBe(0);
			expect(fn28.fn).toBe(28);
		});
	});

	describe('LocoFunctionToggle', () => {
		it('accepts function toggle', () => {
			const msg: LocoFunctionToggle = {
				type: 'loco.command.function.toggle',

				addr: 3,
				fn: 5
			};
			expect(msg.fn).toBe(5);
		});
	});

	describe('LocoEStop', () => {
		it('accepts emergency stop message', () => {
			const msg: LocoEStop = {
				type: 'loco.command.eStop',

				addr: 1845
			};
			expect(msg.addr).toBe(1845);
		});
	});

	describe('StopAll', () => {
		it('accepts stop all message', () => {
			const msg: StopAll = {
				type: 'loco.command.stop.all'
			};
			expect(msg.type).toBe('loco.command.stop.all');
		});
	});

	describe('TurnoutSet', () => {
		it('accepts turnout set to straight', () => {
			const msg: TurnoutSet = {
				type: 'switching.command.turnout.set',

				addr: 12,
				state: 'STRAIGHT',
				pulseMs: 200
			};
			expect(msg.state).toBe('STRAIGHT');
			expect(msg.pulseMs).toBe(200);
		});

		it('accepts turnout set to diverging', () => {
			const msg: TurnoutSet = {
				type: 'switching.command.turnout.set',

				addr: 12,
				state: 'DIVERGING',
				pulseMs: 150
			};
			expect(msg.state).toBe('DIVERGING');
		});
	});

	describe('CV Programming Messages', () => {
		it('accepts CV read message', () => {
			const msg: CvRead = {
				type: 'programming.command.cv.read',
				payload: {
					requestId: 'test-123',
					cvAdress: 29
				}
			};
			expect(msg.payload.cvAdress).toBe(29);
			expect(msg.payload.requestId).toBe('test-123');
		});

		it('accepts CV write message', () => {
			const msg: CvWrite = {
				type: 'programming.command.cv.write',
				payload: {
					requestId: 'test-456',
					cvAdress: 29,
					cvValue: 14
				}
			};
			expect(msg.payload.cvAdress).toBe(29);
			expect(msg.payload.cvValue).toBe(14);
		});

		it('accepts POM CV read message', () => {
			const msg: PomCvRead = {
				type: 'programming.command.pom.read',
				payload: {
					address: 3,
					cvAdress: 1
				}
			};
			expect(msg.payload.address).toBe(3);
			expect(msg.payload.cvAdress).toBe(1);
		});

		it('accepts POM CV write message', () => {
			const msg: PomCvWrite = {
				type: 'programming.command.pom.write',
				payload: {
					adress: 3,
					cvAddress: 1,
					cvValue: 3
				}
			};
			expect(msg.payload.adress).toBe(3);
			expect(msg.payload.cvAddress).toBe(1);
			expect(msg.payload.cvValue).toBe(3);
		});
	});
});
