/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CLIENT_TO_SERVER_TYPES, SERVER_TO_CLIENT_TYPES } from './message-types';
import { MessageValidator } from './messages';

describe('MessageValidator', () => {
	describe('isClientToServerMessage', () => {
		it.each(Object.keys(CLIENT_TO_SERVER_TYPES))('accepts known client-to-server type %s', (type) => {
			expect(MessageValidator.isClientToServerMessage({ type })).toBe(true);
		});

		it('rejects known server-to-client message types', () => {
			for (const type of Object.keys(SERVER_TO_CLIENT_TYPES)) {
				expect(MessageValidator.isClientToServerMessage({ type })).toBe(false);
			}
		});

		it.each([
			null,
			undefined,
			42,
			'message',
			true,
			{},
			{ payload: {} },
			{ type: null },
			{ type: undefined },
			{ type: 42 },
			{ type: '' },
			{ type: 'unknown.message' }
		])('rejects invalid value %p', (value) => {
			expect(MessageValidator.isClientToServerMessage(value)).toBe(false);
		});

		it('validates only the message discriminator', () => {
			expect(
				MessageValidator.isClientToServerMessage({
					type: 'loco.command.drive'
				})
			).toBe(true);
		});
	});

	describe('isServerToClientMessage', () => {
		it.each(Object.keys(SERVER_TO_CLIENT_TYPES))('accepts known server-to-client type %s', (type) => {
			expect(MessageValidator.isServerToClientMessage({ type })).toBe(true);
		});

		it('rejects known client-to-server message types', () => {
			for (const type of Object.keys(CLIENT_TO_SERVER_TYPES)) {
				expect(MessageValidator.isServerToClientMessage({ type })).toBe(false);
			}
		});

		it.each([
			null,
			undefined,
			42,
			'message',
			true,
			{},
			{ payload: {} },
			{ type: null },
			{ type: undefined },
			{ type: 42 },
			{ type: '' },
			{ type: 'unknown.message' }
		])('rejects invalid value %p', (value) => {
			expect(MessageValidator.isServerToClientMessage(value)).toBe(false);
		});

		it('validates only the message discriminator', () => {
			expect(
				MessageValidator.isServerToClientMessage({
					type: 'system.message.trackpower'
				})
			).toBe(true);
		});
	});
});
