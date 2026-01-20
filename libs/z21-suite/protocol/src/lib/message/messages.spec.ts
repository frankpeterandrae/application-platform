/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage, isServerToClientMessage } from './messages';

describe('isClientToServerMessage', () => {
	// Helper function to test multiple invalid inputs (similar to makeProviders pattern in bootstrap.spec.ts)
	function expectAllToBeRejected(values: any[]): void {
		values.forEach((value) => {
			expect(isClientToServerMessage(value)).toBe(false);
		});
	}

	describe('valid client-to-server messages', () => {
		it('accepts server.command.session.hello message', () => {
			expect(isClientToServerMessage({ type: 'server.command.session.hello' })).toBe(true);
		});

		it('accepts trackpower.set message', () => {
			expect(isClientToServerMessage({ type: 'system.command.trackpower.set', on: true })).toBe(true);
		});

		it('accepts loco.command.drive message', () => {
			expect(isClientToServerMessage({ type: 'loco.command.drive', addr: 3, speed: 0.5, dir: 'FWD' })).toBe(true);
		});

		it('accepts loco.function.set message', () => {
			expect(isClientToServerMessage({ type: 'loco.command.function.set', payload: { addr: 5, fn: 0, on: true } })).toBe(true);
		});

		it('accepts loco.function.toggle message', () => {
			expect(isClientToServerMessage({ type: 'loco.command.function.toggle', payload: { addr: 10, fn: 5 } })).toBe(true);
		});

		it('accepts loco.command.eStop message', () => {
			expect(isClientToServerMessage({ type: 'loco.command.eStop', addr: 42 })).toBe(true);
		});

		it('accepts loco.command.stop.all message', () => {
			expect(isClientToServerMessage({ type: 'loco.command.stop.all' })).toBe(true);
		});

		it('accepts switching.command.turnout.set message', () => {
			expect(isClientToServerMessage({ type: 'switching.command.turnout.set', payload: { addr: 1, state: 'closed' } })).toBe(true);
		});

		it('accepts message with extra properties', () => {
			expect(isClientToServerMessage({ type: 'server.command.session.hello', extra: 'data', another: 123 })).toBe(true);
		});

		it('accepts loco.function.toggle message with all required fields', () => {
			expect(isClientToServerMessage({ type: 'loco.command.function.toggle', payload: { addr: 100, fn: 10 } })).toBe(true);
		});

		it('accepts all valid client-to-server message types', () => {
			const validTypes = [
				'server.command.session.hello',
				'system.command.trackpower.set',
				'loco.command.drive',
				'loco.command.function.set',
				'loco.command.function.toggle',
				'loco.command.eStop',
				'loco.command.stop.all',
				'switching.command.turnout.set'
			];

			validTypes.forEach((type) => {
				expect(isClientToServerMessage({ type })).toBe(true);
			});
		});
	});

	describe('invalid input types', () => {
		it('rejects null and undefined', () => {
			expectAllToBeRejected([null, undefined]);
		});

		it('rejects primitive types', () => {
			expectAllToBeRejected([42, 'string', true, false, 0, NaN, Infinity, -Infinity]);
		});

		it('rejects arrays', () => {
			expectAllToBeRejected([[], [{ type: 'server.command.session.hello' }]]);
		});

		it('rejects special objects', () => {
			expectAllToBeRejected([
				new Date(),
				/test/,
				() => {
					// empty
				},
				function () {
					// empty
				}
			]);
		});
	});

	describe('invalid message structures', () => {
		it('rejects object without type property', () => {
			expect(isClientToServerMessage({ data: 'value' })).toBe(false);
		});

		it('rejects empty object', () => {
			expect(isClientToServerMessage({})).toBe(false);
		});

		it('rejects object with non-string type', () => {
			expectAllToBeRejected([
				{ type: 123 },
				{ type: true },
				{ type: {} },
				{ type: [] },
				{ type: Symbol('server.command.session.hello') }
			]);
		});

		it('rejects message with null or undefined type', () => {
			expectAllToBeRejected([{ type: null }, { type: undefined }]);
		});

		it('rejects empty string type', () => {
			expect(isClientToServerMessage({ type: '' })).toBe(false);
		});

		it('rejects unknown message type', () => {
			expect(isClientToServerMessage({ type: 'unknown.type' })).toBe(false);
		});

		it('rejects message with type containing whitespace', () => {
			expectAllToBeRejected([
				{ type: ' server.command.session.hello' },
				{ type: 'server.command.session.hello ' },
				{ type: 'session .hello' }
			]);
		});
	});

	describe('message type validation', () => {
		it('rejects server-to-client message type', () => {
			expectAllToBeRejected([
				{ type: 'server.replay.session.ready' },
				{ type: 'system.message.trackpower' },
				{ type: 'loco.message.state' }
			]);
		});

		it('rejects case-sensitive variations of valid types', () => {
			expectAllToBeRejected([
				{ type: 'Server.Command.Session.Hello' },
				{ type: 'SERVER.COMMAND.SESSION.HELLO' },
				{ type: 'LOCO.COMMAND.DRIVE' }
			]);
		});
	});

	describe('edge cases', () => {
		it('handles messages with prototype chain', () => {
			const proto = { type: 'server.command.session.hello' };
			const obj = Object.create(proto);
			expect(isClientToServerMessage(obj)).toBe(true);
		});
	});
});

describe('isServerToClientMessage', () => {
	// Helper function to test multiple invalid inputs
	function expectAllToBeRejected(values: any[]): void {
		values.forEach((value) => {
			expect(isServerToClientMessage(value)).toBe(false);
		});
	}

	describe('valid server-to-client messages', () => {
		it('accepts server.replay.session.ready message', () => {
			expect(isServerToClientMessage({ type: 'server.replay.session.ready', payload: { protocolVersion: '1.0.0' } })).toBe(true);
		});

		it('accepts system.message.trackpower message', () => {
			expect(isServerToClientMessage({ type: 'system.message.trackpower', payload: { on: true } })).toBe(true);
		});

		it('accepts loco.message.state message', () => {
			expect(
				isServerToClientMessage({ type: 'loco.message.state', payload: { addr: 3, speed: 0.5, dir: 'FWD', fns: {}, estop: false } })
			).toBe(true);
		});

		it('accepts loco.message.eStop message', () => {
			expect(isServerToClientMessage({ type: 'loco.message.eStop', payload: { addr: 5 } })).toBe(true);
		});

		it('accepts turnout.state message', () => {
			expect(isServerToClientMessage({ type: 'switching.message.turnout.state', payload: { addr: 1, state: 'closed' } })).toBe(true);
		});

		it('accepts feedback.message.changed message', () => {
			expect(isServerToClientMessage({ type: 'feedback.message.changed', payload: { source: 'RBUS', addr: 10, value: 1 } })).toBe(
				true
			);
		});

		it('accepts z21.rx message', () => {
			expect(isServerToClientMessage({ type: 'system.message.z21.rx', payload: { datasets: [], events: [], rawHex: 'ABCD' } })).toBe(
				true
			);
		});

		it('accepts system.version message', () => {
			expect(isServerToClientMessage({ type: 'system.message.x.bus.version', payload: { version: 'V1.2', cmdsId: 1 } })).toBe(true);
		});

		it('accepts system.message.stop message', () => {
			expect(isServerToClientMessage({ type: 'system.message.stop' })).toBe(true);
		});

		it('accepts system.message.firmware.version message', () => {
			expect(isServerToClientMessage({ type: 'system.message.firmware.version', payload: { major: 1, minor: 20 } })).toBe(true);
		});

		it('accepts system.message.hardware.info message', () => {
			expect(isServerToClientMessage({ type: 'system.message.hardware.info', payload: { hardwareType: 'Z21_XL' } })).toBe(true);
		});

		it('accepts system.message.z21.code message', () => {
			expect(isServerToClientMessage({ type: 'system.message.z21.code', payload: { code: 42 } })).toBe(true);
		});

		it('accepts message with extra properties', () => {
			expect(
				isServerToClientMessage({
					type: 'server.replay.session.ready',
					payload: { protocolVersion: '1.0.0', extra: 'data', another: 123 }
				})
			).toBe(true);
		});

		it('accepts all valid server-to-client message types', () => {
			const validTypes = [
				'feedback.message.changed',
				'loco.message.eStop',
				'loco.message.state',
				'server.replay.session.ready',
				'programming.replay.cv.nack',
				'programming.replay.cv.result',
				'system.message.z21.code',
				'system.message.firmware.version',
				'system.message.hardware.info',
				'system.message.stop',
				'system.message.trackpower',
				'system.message.x.bus.version',
				'switching.message.turnout.state',
				'system.message.z21.rx'
			];

			validTypes.forEach((type) => {
				expect(isServerToClientMessage({ type })).toBe(true);
			});
		});
	});

	describe('invalid input types', () => {
		it('rejects null and undefined', () => {
			expectAllToBeRejected([null, undefined]);
		});

		it('rejects primitive types', () => {
			expectAllToBeRejected([42, 'string', true, false, 0, NaN, Infinity, -Infinity]);
		});

		it('rejects arrays', () => {
			expectAllToBeRejected([[], [{ type: 'server.replay.session.ready' }]]);
		});

		it('rejects special objects', () => {
			expectAllToBeRejected([
				new Date(),
				/test/,
				() => {
					// empty
				},
				function () {
					// empty
				}
			]);
		});
	});

	describe('invalid message structures', () => {
		it('rejects object without type property', () => {
			expect(isServerToClientMessage({ data: 'value' })).toBe(false);
		});

		it('rejects empty object', () => {
			expect(isServerToClientMessage({})).toBe(false);
		});

		it('rejects object with non-string type', () => {
			expectAllToBeRejected([
				{ type: 123 },
				{ type: true },
				{ type: {} },
				{ type: [] },
				{ type: Symbol('server.replay.session.ready') }
			]);
		});

		it('rejects message with null or undefined type', () => {
			expectAllToBeRejected([{ type: null }, { type: undefined }]);
		});

		it('rejects empty string type', () => {
			expect(isServerToClientMessage({ type: '' })).toBe(false);
		});

		it('rejects unknown message type', () => {
			expect(isServerToClientMessage({ type: 'unknown.type' })).toBe(false);
		});

		it('rejects message with type containing whitespace', () => {
			expectAllToBeRejected([
				{ type: ' server.replay.session.ready' },
				{ type: 'server.replay.session.ready ' },
				{ type: 'system. trackPower' }
			]);
		});
	});

	describe('message type validation', () => {
		it('rejects client-to-server message type', () => {
			expectAllToBeRejected([
				{ type: 'server.command.session.hello' },
				{ type: 'system.command.trackpower.set' },
				{ type: 'loco.command.drive' }
			]);
		});

		it('rejects case-sensitive variations of valid types', () => {
			expectAllToBeRejected([
				{ type: 'Server.Replay.Session.Ready' },
				{ type: 'SERVER.REPLAY.SESSION.READY' },
				{ type: 'LOCO.MESSAGE.STATE' }
			]);
		});
	});

	describe('edge cases', () => {
		it('handles messages with prototype chain', () => {
			const proto = { type: 'server.replay.session.ready' };
			const obj = Object.create(proto);
			expect(isServerToClientMessage(obj)).toBe(true);
		});

		it('handles Object.create(null) with valid type', () => {
			const msg = Object.create(null);
			msg.type = 'server.replay.session.ready';
			expect(isServerToClientMessage(msg)).toBe(true);
		});

		it('handles frozen objects with valid type', () => {
			const msg = Object.freeze({ type: 'system.message.stop' });
			expect(isServerToClientMessage(msg)).toBe(true);
		});

		it('handles sealed objects with valid type', () => {
			const msg = Object.seal({ type: 'loco.message.state', addr: 1, speed: 0, dir: 'FWD', fns: {}, estop: false });
			expect(isServerToClientMessage(msg)).toBe(true);
		});
	});
});
