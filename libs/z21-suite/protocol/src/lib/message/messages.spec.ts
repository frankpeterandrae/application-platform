/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage } from './messages';

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
