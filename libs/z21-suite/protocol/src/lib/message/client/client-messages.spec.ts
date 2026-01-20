/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoDrive } from './loco/loco-drive';
import type { LocoEStop } from './loco/loco-estop';
import type { LocoFunctionSet } from './loco/loco-function-set';
import type { LocoFunctionToggle } from './loco/loco-function-toggle';
import type { StopAll } from './loco/stop-all';
import type { CvRead } from './programming/cv-read';
import type { CvWrite } from './programming/cv-write';
import type { PomCvRead } from './programming/pom-cv-read';
import type { PomCvWrite } from './programming/pom-cv-write';
import type { SessionHello } from './server/session-hello';
import type { TurnoutSet } from './switching/turnout-set';
import type { TrackpowerSet } from './system/trackpower-set';

describe('Client Message Types', () => {
	describe('SessionHello', () => {
		it('accepts valid server.command.session.hello message', () => {
			const msg: SessionHello = {
				type: 'server.command.session.hello',
				payload: { protocolVersion: '1.0.0', requestId: 'hello-001' }
			};
			expect(msg.type).toBe('server.command.session.hello');
			expect(msg.payload.protocolVersion).toBe('1.0.0');
		});

		it('accepts server.command.session.hello with different protocol version', () => {
			const msg: SessionHello = {
				type: 'server.command.session.hello',
				payload: { protocolVersion: '2.1.0', requestId: 'hello-002' }
			};
			expect(msg.payload.protocolVersion).toBe('2.1.0');
		});
	});

	describe('TrackpowerSet', () => {
		it('accepts trackpower on message', () => {
			const msg: TrackpowerSet = {
				type: 'system.command.trackpower.set',
				payload: {
					on: true,
					requestId: 'tp-001'
				}
			};
			expect(msg.payload.on).toBe(true);
		});

		it('accepts trackpower off message', () => {
			const msg: TrackpowerSet = {
				type: 'system.command.trackpower.set',
				payload: {
					on: false,
					requestId: 'tp-002'
				}
			};
			expect(msg.payload.on).toBe(false);
		});
	});

	describe('LocoDrive', () => {
		it('accepts valid loco drive message with forward direction', () => {
			const msg: LocoDrive = {
				type: 'loco.command.drive',
				payload: {
					addr: 3,
					speed: 50,
					dir: 'FWD',
					steps: 128,
					requestId: 'req-001'
				}
			};
			expect(msg.payload.addr).toBe(3);
			expect(msg.payload.speed).toBe(50);
			expect(msg.payload.dir).toBe('FWD');
			expect(msg.payload.steps).toBe(128);
		});

		it('accepts loco drive with reverse direction', () => {
			const msg: LocoDrive = {
				type: 'loco.command.drive',
				payload: {
					addr: 1845,
					speed: 0,
					dir: 'REV',
					steps: 28,
					requestId: 'req-002'
				}
			};
			expect(msg.payload.dir).toBe('REV');
		});

		it('accepts different speed steps values', () => {
			const msg14: LocoDrive = {
				type: 'loco.command.drive',
				payload: { addr: 1, speed: 0, dir: 'FWD', steps: 14, requestId: 'req-03' }
			};
			const msg28: LocoDrive = {
				type: 'loco.command.drive',
				payload: { addr: 1, speed: 0, dir: 'FWD', steps: 28, requestId: 'req-04' }
			};
			const msg128: LocoDrive = {
				type: 'loco.command.drive',
				payload: { addr: 1, speed: 0, dir: 'FWD', steps: 128, requestId: 'req-05' }
			};

			expect(msg14.payload.steps).toBe(14);
			expect(msg28.payload.steps).toBe(28);
			expect(msg128.payload.steps).toBe(128);
		});
	});

	describe('LocoFunctionSet', () => {
		it('accepts function set on', () => {
			const msg: LocoFunctionSet = {
				type: 'loco.command.function.set',
				payload: {
					addr: 3,
					fn: 0,
					on: true,
					requestId: 'req-006'
				}
			};
			expect(msg.payload.fn).toBe(0);
			expect(msg.payload.on).toBe(true);
		});

		it('accepts function set off', () => {
			const msg: LocoFunctionSet = {
				type: 'loco.command.function.set',
				payload: {
					addr: 3,
					fn: 7,
					on: false,
					requestId: 'req-007'
				}
			};
			expect(msg.payload.fn).toBe(7);
			expect(msg.payload.on).toBe(false);
		});

		it('accepts different function numbers', () => {
			const fn0: LocoFunctionSet = { type: 'loco.command.function.set', payload: { addr: 1, fn: 0, on: true, requestId: 'req-008' } };
			const fn28: LocoFunctionSet = {
				type: 'loco.command.function.set',
				payload: { addr: 1, fn: 28, on: true, requestId: 'req-009' }
			};

			expect(fn0.payload.fn).toBe(0);
			expect(fn28.payload.fn).toBe(28);
		});
	});

	describe('LocoFunctionToggle', () => {
		it('accepts function toggle', () => {
			const msg: LocoFunctionToggle = {
				type: 'loco.command.function.toggle',
				payload: {
					addr: 3,
					fn: 5,
					requestId: 'req-010'
				}
			};
			expect(msg.payload.fn).toBe(5);
		});
	});

	describe('LocoEStop', () => {
		it('accepts emergency stop message', () => {
			const msg: LocoEStop = {
				type: 'loco.command.eStop',
				payload: {
					addr: 1845,
					requestId: 'estop-001'
				}
			};
			expect(msg.payload.addr).toBe(1845);
		});
	});

	describe('StopAll', () => {
		it('accepts stop all message', () => {
			const msg: StopAll = {
				type: 'loco.command.stop.all',
				payload: { requestId: 'stopall-001' }
			};
			expect(msg.type).toBe('loco.command.stop.all');
		});
	});

	describe('TurnoutSet', () => {
		it('accepts turnout set to straight', () => {
			const msg: TurnoutSet = {
				type: 'switching.command.turnout.set',
				payload: {
					addr: 12,
					state: 'STRAIGHT',
					pulseMs: 200,
					requestId: 'turnout-001'
				}
			};
			expect(msg.payload.state).toBe('STRAIGHT');
			expect(msg.payload.pulseMs).toBe(200);
		});

		it('accepts turnout set to diverging', () => {
			const msg: TurnoutSet = {
				type: 'switching.command.turnout.set',
				payload: {
					addr: 12,
					state: 'DIVERGING',
					pulseMs: 150,
					requestId: 'turnout-002'
				}
			};
			expect(msg.payload.state).toBe('DIVERGING');
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
				type: 'programming.command.pom.cv.read',
				payload: {
					requestId: 'test-789',
					address: 3,
					cvAdress: 1
				}
			};
			expect(msg.payload.address).toBe(3);
			expect(msg.payload.cvAdress).toBe(1);
		});

		it('accepts POM CV write message', () => {
			const msg: PomCvWrite = {
				type: 'programming.command.pom.cv.write',
				payload: {
					requestId: 'test-012',
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
