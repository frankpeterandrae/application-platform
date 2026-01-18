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
		expect(isClientToServerMessage({ type: 'loco.command.function.toggle', addr: 5, fn: 0 })).toBe(true);
	});

	it('accepts loco.eStop message', () => {
		expect(isClientToServerMessage({ type: 'loco.command.eStop', addr: 42 })).toBe(true);
	});

	it('accepts stop.all message', () => {
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
	});

	it('rejects object without type property', () => {
		expect(isClientToServerMessage({ data: 'value' })).toBe(false);
	});

	it('rejects object with non-string type', () => {
		expect(isClientToServerMessage({ type: 123 })).toBe(false);
		expect(isClientToServerMessage({ type: null })).toBe(false);
		expect(isClientToServerMessage({ type: undefined })).toBe(false);
	});

	it('rejects unknown message type', () => {
		expect(isClientToServerMessage({ type: 'unknown.type' })).toBe(false);
		expect(isClientToServerMessage({ type: 'ping' })).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isClientToServerMessage({})).toBe(false);
	});

	it('accepts message with extra properties', () => {
		expect(isClientToServerMessage({ type: 'server.command.session.hello', extra: 'data', another: 123 })).toBe(true);
	});
});

describe('isServerToClientMessage', () => {
	it('accepts session.ready message', () => {
		expect(isServerToClientMessage({ type: 'server.replay.session.ready', protocolVersion: '1.0.0' })).toBe(true);
	});

	it('accepts system.trackPower message', () => {
		expect(isServerToClientMessage({ type: 'system.message.trackpower', on: true })).toBe(true);
	});

	it('accepts loco.state message', () => {
		expect(isServerToClientMessage({ type: 'loco.message.state', addr: 3, speed: 0.5, dir: 'fwd', fns: {}, estop: false })).toBe(true);
	});

	it('accepts loco.eStop message', () => {
		expect(isServerToClientMessage({ type: 'loco.message.eStop', addr: 5 })).toBe(true);
	});

	it('accepts turnout.state message', () => {
		expect(isServerToClientMessage({ type: 'switching.message.turnout.state', addr: 1, state: 'closed' })).toBe(true);
	});

	it('accepts feedback.changed message', () => {
		expect(isServerToClientMessage({ type: 'feedback.message.changed', source: 'RBUS', addr: 10, value: 1 })).toBe(true);
	});

	it('accepts z21.rx message', () => {
		expect(isServerToClientMessage({ type: 'system.message.z21.rx', datasets: [], events: [], rawHex: 'ABCD' })).toBe(true);
	});

	it('accepts system.xBusVersion message', () => {
		expect(isServerToClientMessage({ type: 'system.message.x.bus.version', version: 'V1.2', cmdsId: 1 })).toBe(true);
	});

	it('accepts system.message.firmware.version message', () => {
		expect(isServerToClientMessage({ type: 'system.message.firmware.version', major: 0x01, minor: 0x12 })).toBe(true);
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
	});

	it('rejects object without type property', () => {
		expect(isServerToClientMessage({ data: 'value' })).toBe(false);
	});

	it('rejects object with non-string type', () => {
		expect(isServerToClientMessage({ type: 123 })).toBe(false);
		expect(isServerToClientMessage({ type: null })).toBe(false);
		expect(isServerToClientMessage({ type: undefined })).toBe(false);
	});

	it('rejects unknown message type', () => {
		expect(isServerToClientMessage({ type: 'unknown.type' })).toBe(false);
		expect(isServerToClientMessage({ type: 'ping' })).toBe(false);
	});

	it('rejects empty object', () => {
		expect(isServerToClientMessage({})).toBe(false);
	});

	it('accepts message with extra properties', () => {
		expect(
			isServerToClientMessage({ type: 'server.replay.session.ready', protocolVersion: '1.0.0', extra: 'data', another: 123 })
		).toBe(true);
	});
});
