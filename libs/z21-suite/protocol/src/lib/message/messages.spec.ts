/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage, isServerToClientMessage } from './messages';

describe('isClientToServerMessage', () => {
	it('accepts server.command.session.hello message', () => {
		expect(isClientToServerMessage({ type: 'server.command.session.hello' })).toBe(true);
	});

	it('accepts system.command.trackpower.set message', () => {
		expect(isClientToServerMessage({ type: 'system.command.trackpower.set', on: true })).toBe(true);
	});

	it('accepts loco.command.drive message', () => {
		expect(isClientToServerMessage({ type: 'loco.command.drive', addr: 3, speed: 0.5, dir: 'fwd' })).toBe(true);
	});

	it('accepts loco.command.function.set message', () => {
		expect(isClientToServerMessage({ type: 'loco.command.function.set', addr: 5, fn: 0, on: true })).toBe(true);
	});

	it('accepts loco.command.function.toggle message', () => {
		expect(isClientToServerMessage({ type: 'loco.command.function.toggle', addr: 10, fn: 5 })).toBe(true);
	});

	it('accepts loco.command.eStop message', () => {
		expect(isClientToServerMessage({ type: 'loco.command.eStop', addr: 42 })).toBe(true);
	});

	it('accepts loco.command.stop.all message', () => {
		expect(isClientToServerMessage({ type: 'loco.command.stop.all' })).toBe(true);
	});

	it('accepts switching.command.turnout.set message', () => {
		expect(isClientToServerMessage({ type: 'switching.command.turnout.set', addr: 1, state: 'closed' })).toBe(true);
	});

	it('rejects null', () => {
		expect(isClientToServerMessage(null)).toBe(false);
	});

	it('rejects undefined', () => {
		expect(isClientToServerMessage(undefined)).toBe(false);
	});

	it('rejects primitive types', () => {
		expect(isClientToServerMessage(42)).toBe(false);
		expect(isClientToServerMessage('string')).toBe(false);
		expect(isClientToServerMessage(true)).toBe(false);
		expect(isClientToServerMessage(false)).toBe(false);
		expect(isClientToServerMessage(0)).toBe(false);
	});

	it('rejects object without type property', () => {
		expect(isClientToServerMessage({ data: 'value' })).toBe(false);
	});

	it('rejects object with non-string type', () => {
		expect(isClientToServerMessage({ type: 123 })).toBe(false);
		expect(isClientToServerMessage({ type: true })).toBe(false);
		expect(isClientToServerMessage({ type: {} })).toBe(false);
		expect(isClientToServerMessage({ type: [] })).toBe(false);
	});

	it('rejects unknown message type', () => {
		expect(isClientToServerMessage({ type: 'unknown.type' })).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isClientToServerMessage({})).toBe(false);
	});

	it('rejects empty string type', () => {
		expect(isClientToServerMessage({ type: '' })).toBe(false);
	});

	it('rejects arrays', () => {
		expect(isClientToServerMessage([])).toBe(false);
		expect(isClientToServerMessage([{ type: 'server.command.session.hello' }])).toBe(false);
	});

	it('accepts message with extra properties', () => {
		expect(isClientToServerMessage({ type: 'server.command.session.hello', extra: 'data', another: 123 })).toBe(true);
	});

	it('accepts loco.command.function.toggle message with all required fields', () => {
		expect(isClientToServerMessage({ type: 'loco.command.function.toggle', addr: 100, fn: 10 })).toBe(true);
	});

	it('rejects server-to-client message type', () => {
		expect(isClientToServerMessage({ type: 'session.command.ready' })).toBe(false);
		expect(isClientToServerMessage({ type: 'system.command.trackpower' })).toBe(false);
		expect(isClientToServerMessage({ type: 'loco.command.state' })).toBe(false);
	});

	it('rejects message with type containing whitespace', () => {
		expect(isClientToServerMessage({ type: ' server.command.session.hello' })).toBe(false);
		expect(isClientToServerMessage({ type: 'server.command.session.hello ' })).toBe(false);
		expect(isClientToServerMessage({ type: 'session .command.hello' })).toBe(false);
	});

	it('rejects message with type as Symbol', () => {
		expect(isClientToServerMessage({ type: Symbol('server.command.session.hello') })).toBe(false);
	});

	it('rejects message with null type', () => {
		expect(isClientToServerMessage({ type: null })).toBe(false);
	});

	it('rejects message with undefined type', () => {
		expect(isClientToServerMessage({ type: undefined })).toBe(false);
	});

	it('handles Date objects', () => {
		expect(isClientToServerMessage(new Date())).toBe(false);
	});

	it('handles RegExp objects', () => {
		expect(isClientToServerMessage(/test/)).toBe(false);
	});

	it('handles functions', () => {
		expect(
			isClientToServerMessage(() => {
				// empty
			})
		).toBe(false);
		expect(
			isClientToServerMessage(function () {
				// empty
			})
		).toBe(false);
	});

	it('rejects NaN', () => {
		expect(isClientToServerMessage(NaN)).toBe(false);
	});

	it('rejects Infinity', () => {
		expect(isClientToServerMessage(Infinity)).toBe(false);
		expect(isClientToServerMessage(-Infinity)).toBe(false);
	});

	it('handles messages with prototype chain', () => {
		const proto = { type: 'server.command.session.hello' };
		const obj = Object.create(proto);
		expect(isClientToServerMessage(obj)).toBe(true);
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

	it('rejects case-sensitive variations of valid types', () => {
		expect(isClientToServerMessage({ type: 'Session.command.Hello' })).toBe(false);
		expect(isClientToServerMessage({ type: 'SESSION.COMMAND.HELLO' })).toBe(false);
		expect(isClientToServerMessage({ type: 'LOCO.COMMAND.DRIVE' })).toBe(false);
	});
});

describe('isServerToClientMessage', () => {
	it('accepts server.replay.session.ready message', () => {
		expect(isServerToClientMessage({ type: 'server.replay.session.ready', protocolVersion: '1.0.0' })).toBe(true);
	});

	it('accepts system.message.trackPower message', () => {
		expect(isServerToClientMessage({ type: 'system.message.trackpower', on: true })).toBe(true);
	});

	it('accepts loco.message.state message', () => {
		expect(isServerToClientMessage({ type: 'loco.message.state', addr: 3, speed: 0.5, dir: 'fwd', fns: {}, estop: false })).toBe(true);
	});

	it('accepts loco.message.eStop message', () => {
		expect(isServerToClientMessage({ type: 'loco.message.eStop', addr: 5 })).toBe(true);
	});

	it('accepts switching.message.turnout.state message', () => {
		expect(isServerToClientMessage({ type: 'switching.message.turnout.state', addr: 1, state: 'closed' })).toBe(true);
	});

	it('accepts feedback.message.changed message', () => {
		expect(isServerToClientMessage({ type: 'feedback.message.changed', source: 'RBUS', addr: 10, value: 1 })).toBe(true);
	});

	it('accepts system.message.z21.rx message', () => {
		expect(isServerToClientMessage({ type: 'system.message.z21.rx', datasets: [], events: [], rawHex: 'ABCD' })).toBe(true);
	});

	it('accepts system.message.xBusVersion message', () => {
		expect(isServerToClientMessage({ type: 'system.message.x.bus.version', version: 'V1.2', cmdsId: 1 })).toBe(true);
	});

	it('accepts system.message.stop message', () => {
		expect(isServerToClientMessage({ type: 'system.message.stop' })).toBe(true);
	});

	it('rejects null', () => {
		expect(isServerToClientMessage(null)).toBe(false);
	});

	it('rejects undefined', () => {
		expect(isServerToClientMessage(undefined)).toBe(false);
	});

	it('rejects primitive types', () => {
		expect(isServerToClientMessage(42)).toBe(false);
		expect(isServerToClientMessage('string')).toBe(false);
		expect(isServerToClientMessage(true)).toBe(false);
		expect(isServerToClientMessage(false)).toBe(false);
		expect(isServerToClientMessage(0)).toBe(false);
	});

	it('rejects object without type property', () => {
		expect(isServerToClientMessage({ data: 'value' })).toBe(false);
	});

	it('rejects object with non-string type', () => {
		expect(isServerToClientMessage({ type: 123 })).toBe(false);
		expect(isServerToClientMessage({ type: true })).toBe(false);
		expect(isServerToClientMessage({ type: {} })).toBe(false);
		expect(isServerToClientMessage({ type: [] })).toBe(false);
	});

	it('rejects unknown message type', () => {
		expect(isServerToClientMessage({ type: 'unknown.message.type' })).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isServerToClientMessage({})).toBe(false);
	});

	it('rejects empty string type', () => {
		expect(isServerToClientMessage({ type: '' })).toBe(false);
	});

	it('rejects arrays', () => {
		expect(isServerToClientMessage([])).toBe(false);
		expect(isServerToClientMessage([{ type: 'server.replay.session.ready' }])).toBe(false);
	});

	it('accepts message with extra properties', () => {
		expect(
			isServerToClientMessage({ type: 'server.replay.session.ready', protocolVersion: '1.0.0', extra: 'data', another: 123 })
		).toBe(true);
	});

	it('accepts system.message.firmware.version message', () => {
		expect(isServerToClientMessage({ type: 'system.message.firmware.version', major: 1, minor: 20 })).toBe(true);
	});

	it('accepts system.message.hardware.info message', () => {
		expect(isServerToClientMessage({ type: 'system.message.hardware.info', hardwareType: 'Z21_XL' })).toBe(true);
	});

	it('accepts system.message.z21.code message', () => {
		expect(isServerToClientMessage({ type: 'system.message.z21.code', code: 42 })).toBe(true);
	});

	it('rejects client-to-server message type', () => {
		expect(isServerToClientMessage({ type: 'session.message.hello' })).toBe(false);
		expect(isServerToClientMessage({ type: 'trackpower.message.set' })).toBe(false);
		expect(isServerToClientMessage({ type: 'loco.message.drive' })).toBe(false);
	});

	it('rejects message with type containing whitespace', () => {
		expect(isServerToClientMessage({ type: ' server.replay.session.ready' })).toBe(false);
		expect(isServerToClientMessage({ type: 'server.replay.session.ready ' })).toBe(false);
		expect(isServerToClientMessage({ type: 'system.message. trackPower' })).toBe(false);
	});

	it('rejects message with type as Symbol', () => {
		expect(isServerToClientMessage({ type: Symbol('server.replay.session.ready') })).toBe(false);
	});

	it('rejects message with null type', () => {
		expect(isServerToClientMessage({ type: null })).toBe(false);
	});

	it('rejects message with undefined type', () => {
		expect(isServerToClientMessage({ type: undefined })).toBe(false);
	});

	it('handles Date objects', () => {
		expect(isServerToClientMessage(new Date())).toBe(false);
	});

	it('handles RegExp objects', () => {
		expect(isServerToClientMessage(/test/)).toBe(false);
	});

	it('handles functions', () => {
		expect(
			isServerToClientMessage(() => {
				// empty
			})
		).toBe(false);
		expect(
			isServerToClientMessage(function () {
				// empty
			})
		).toBe(false);
	});

	it('rejects NaN', () => {
		expect(isServerToClientMessage(NaN)).toBe(false);
	});

	it('rejects Infinity', () => {
		expect(isServerToClientMessage(Infinity)).toBe(false);
		expect(isServerToClientMessage(-Infinity)).toBe(false);
	});

	it('handles messages with prototype chain', () => {
		const proto = { type: 'server.replay.session.ready' };
		const obj = Object.create(proto);
		expect(isServerToClientMessage(obj)).toBe(true);
	});

	it('accepts all valid server-to-client message types', () => {
		const validTypes = [
			'feedback.message.changed',
			'loco.message.eStop',
			'loco.message.state',
			'server.replay.session.ready',
			'switching.message.turnout.state',
			'system.message.firmware.version',
			'system.message.hardware.info',
			'system.message.stop',
			'system.message.trackpower',
			'system.message.x.bus.version',
			'system.message.z21.code',
			'system.message.z21.rx'
		];

		validTypes.forEach((type) => {
			expect(isServerToClientMessage({ type })).toBe(true);
		});
	});

	it('rejects case-sensitive variations of valid types', () => {
		expect(isServerToClientMessage({ type: 'Session.message.Ready' })).toBe(false);
		expect(isServerToClientMessage({ type: 'SESSION.message.READY' })).toBe(false);
		expect(isServerToClientMessage({ type: 'LOCO.message.STATE' })).toBe(false);
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
		const msg = Object.seal({ type: 'loco.message.state', addr: 1, speed: 0, dir: 'fwd', fns: {}, estop: false });
		expect(isServerToClientMessage(msg)).toBe(true);
	});
});
