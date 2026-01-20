/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import * as dgram from 'node:dgram';

import { Mock, resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { Logger, Z21LanHeader } from '@application-platform/z21-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Z21BroadcastFlag } from '../constants';

import { Z21Udp } from './udp';

// Mock dgram module
vi.mock('node:dgram', () => {
	const socket = {
		on: vi.fn(),
		bind: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		removeAllListeners: vi.fn(),
		address: vi.fn(() => ({ address: '0.0.0.0', port: 21105 }))
	};
	return { createSocket: vi.fn(() => socket) };
});

type MockSocket = {
	on: vi.Mock;
	bind: vi.Mock;
	send: vi.Mock;
	close: vi.Mock;
	removeAllListeners: vi.Mock;
	address: vi.Mock;
};

type Services = {
	logger: vi.Mocked<Logger>;
	socket: MockSocket;
	udp: Z21Udp;
};

describe('Z21Udp', () => {
	// Helper function to get mocked socket (similar to getSocket but typed)
	function getSocket(): MockSocket {
		return (dgram.createSocket as vi.Mock).mock.results[0].value;
	}

	// Helper function to create test services (similar to makeProviders in bootstrap.spec.ts)
	function makeServices(host = 'host', port = 1234): Services {
		const logger = Mock<Logger>() as any;
		const udp = new Z21Udp(host, port, logger);
		const socket = getSocket();

		return { logger, socket, udp };
	}

	// Helper function to get message handler from socket
	function getMessageHandler(socket: MockSocket): ((msg: Buffer, rinfo: { address: string; port: number }) => void) | undefined {
		return socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
	}

	// Helper function to create datagram event spy
	function createDatagramSpy(udp: Z21Udp): vi.Mock {
		const spy = vi.fn();
		udp.on('datagram', spy);
		return spy;
	}

	// Helper function to verify datagram event structure
	function expectDatagramEvent(
		spy: vi.Mock,
		expected: {
			from?: { address: string; port: number };
			raw?: Buffer;
			rawHex?: string;
		}
	): void {
		expect(spy).toHaveBeenCalledWith(expect.objectContaining(expected));
	}

	// Helper function to verify buffer content
	function expectBufferHeader(buffer: Buffer, length: number, header: number): void {
		expect(buffer.readUInt16LE(0)).toBe(length);
		expect(buffer.readUInt16LE(2)).toBe(header);
	}

	let services: Services;

	beforeEach(() => {
		services = makeServices();
		resetMocksBeforeEach(services);
	});

	describe('socket initialization', () => {
		it('binds UDP socket on start with default port and wires listeners', () => {
			services.udp.start();

			expect(services.socket.on).toHaveBeenCalledWith('message', expect.any(Function));
			expect(services.socket.bind).toHaveBeenCalledWith(21105);
		});

		it('allows custom listen port', () => {
			services.udp.start(54321);

			expect(services.socket.bind).toHaveBeenCalledWith(54321);
		});

		it('does not start twice', () => {
			services.udp.start();
			const bindCallCount = services.socket.bind.mock.calls.length;

			services.udp.start();

			expect(services.socket.bind.mock.calls.length).toBe(bindCallCount);
		});
	});

	describe('datagram events', () => {
		it('emits datagram event with raw buffer and sender info', () => {
			services.udp.start();
			const messageHandler = getMessageHandler(services.socket);
			const msg = Buffer.from([0x04, 0x00, 0x10, 0x00]);
			const datagramSpy = createDatagramSpy(services.udp);

			messageHandler?.(msg, { address: '192.168.0.111', port: 21105 } as any);

			expectDatagramEvent(datagramSpy, {
				from: { address: '192.168.0.111', port: 21105 },
				raw: msg,
				rawHex: '04001000'
			});
		});

		it('emits datagram for serial number response', () => {
			services.udp.start();
			const messageHandler = getMessageHandler(services.socket);
			const msg = Buffer.alloc(8);
			msg.writeUInt16LE(0x0008, 0);
			msg.writeUInt16LE(Z21LanHeader.LAN_GET_SERIAL_NUMBER, 2);
			msg.writeUInt32LE(0xdeadbeef, 4);
			const datagramSpy = createDatagramSpy(services.udp);

			messageHandler?.(msg, { address: '10.0.0.1', port: 21105 } as any);

			expectDatagramEvent(datagramSpy, {
				from: { address: '10.0.0.1', port: 21105 },
				raw: msg
			});
		});

		it('emits datagram for any message length', () => {
			services.udp.start();
			const messageHandler = getMessageHandler(services.socket);
			const datagramSpy = createDatagramSpy(services.udp);

			messageHandler?.(Buffer.from([0x01]), { address: '1.2.3.4', port: 21105 } as any);

			expectDatagramEvent(datagramSpy, {
				from: { address: '1.2.3.4', port: 21105 },
				raw: Buffer.from([0x01]),
				rawHex: '01'
			});
		});

		it('converts buffer to hex string correctly', () => {
			services.udp.start();
			const messageHandler = getMessageHandler(services.socket);
			const msg = Buffer.from([0xaa, 0xbb, 0xcc, 0xdd]);
			const datagramSpy = createDatagramSpy(services.udp);

			messageHandler?.(msg, { address: '1.2.3.4', port: 21105 } as any);

			expectDatagramEvent(datagramSpy, { rawHex: 'aabbccdd' });
		});

		it('handles different sender addresses', () => {
			services.udp.start();
			const messageHandler = getMessageHandler(services.socket);
			const datagramSpy = createDatagramSpy(services.udp);

			messageHandler?.(Buffer.from([0x04, 0x00, 0x10, 0x00]), { address: '192.168.1.111', port: 12345 } as any);

			expectDatagramEvent(datagramSpy, {
				from: { address: '192.168.1.111', port: 12345 }
			});
		});

		it('preserves raw buffer in datagram event', () => {
			services.udp.start();
			const messageHandler = getMessageHandler(services.socket);
			const msg = Buffer.from([0x08, 0x00, 0x40, 0x00, 0x01, 0x02, 0x03, 0x04]);
			const datagramSpy = createDatagramSpy(services.udp);

			messageHandler?.(msg, { address: '1.1.1.1', port: 21105 } as any);

			const emitted = datagramSpy.mock.calls[0][0];
			expect(Buffer.isBuffer(emitted.raw)).toBe(true);
			expect(emitted.raw).toEqual(msg);
		});
	});

	describe('send methods', () => {
		it('sendRaw delegates to socket.send with configured host/port', () => {
			const customServices = makeServices('hostX', 5555);
			const buf = Buffer.from([1, 2, 3]);

			customServices.udp.sendRaw(buf);

			expect(customServices.socket.send).toHaveBeenCalledWith(buf, 5555, 'hostX');
		});

		it('sendGetSerial builds proper packet', () => {
			services.udp.sendGetSerial();

			const sent = services.socket.send.mock.calls[0][0] as Buffer;
			expectBufferHeader(sent, 0x0004, Z21LanHeader.LAN_GET_SERIAL_NUMBER);
		});

		it('sendSetBroadcastFlags builds proper packet', () => {
			services.udp.sendSetBroadcastFlags(Z21BroadcastFlag.SystemState | Z21BroadcastFlag.Basic);

			const sent = services.socket.send.mock.calls[0][0] as Buffer;
			expectBufferHeader(sent, 0x0008, Z21LanHeader.LAN_SET_BROADCASTFLAGS);
			expect(sent.readUInt32LE(4)).toBe(Z21BroadcastFlag.SystemState | Z21BroadcastFlag.Basic);
		});

		it('sendSystemStateGetData builds proper packet', () => {
			services.udp.sendSystemStateGetData();

			const sent = services.socket.send.mock.calls[0][0] as Buffer;
			expectBufferHeader(sent, 0x0004, Z21LanHeader.LAN_SYSTEM_STATE_DATAGET);
		});

		it('sendLogOff builds proper packet', () => {
			services.udp.sendLogOff();

			const sent = services.socket.send.mock.calls[0][0] as Buffer;
			expectBufferHeader(sent, 0x0004, Z21LanHeader.LAN_LOGOFF);
		});
	});

	describe('lifecycle management', () => {
		it('stop closes socket gracefully', () => {
			services.udp.start();

			services.udp.stop();

			expect(services.socket.close).toHaveBeenCalled();
		});

		it('stop does nothing when not started', () => {
			services.udp.stop();

			expect(services.socket.close).not.toHaveBeenCalled();
		});

		it('stop removes all listeners', () => {
			services.udp.start();

			services.udp.stop();

			expect(services.socket.removeAllListeners).toHaveBeenCalled();
		});

		it('can be restarted after stop', () => {
			services.udp.start();
			services.udp.stop();

			services.udp.start();

			expect(services.socket.bind).toHaveBeenCalled();
		});
	});
});
