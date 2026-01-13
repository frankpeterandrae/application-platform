/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import * as dgram from 'node:dgram';

import { vi } from 'vitest';

import { Z21Udp } from './udp';

// Mock dgram module
vi.mock('node:dgram', () => {
	// Each createSocket call returns a fresh socket object with its own mock functions.
	const createSocketMock = vi.fn(() => ({
		on: vi.fn(),
		bind: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		removeAllListeners: vi.fn(),
		address: vi.fn(() => ({ address: '0.0.0.0', port: 21105 }))
	}));

	return {
		__esModule: true,
		createSocket: createSocketMock,
		default: { createSocket: createSocketMock }
	};
});

type MockSocket = {
	on: any;
	bind: any;
	send: any;
	close: any;
	removeAllListeners: any;
	address: any;
};

type Services = {
	socket: MockSocket;
	udp: Z21Udp;
};

describe('Z21Udp', () => {
	// Helper function to get mocked socket (similar to getSocket but typed)
	function getSocket(): MockSocket {
		const mock = (dgram.createSocket as any).mock;
		const results = mock && mock.results ? mock.results : [];
		return results[results.length - 1].value;
	}

	// Helper function to create test services (similar to makeProviders in bootstrap.spec.ts)
	function makeServices(host = 'host', port = 1234): Services {
		const udp = new Z21Udp(host, port);
		const socket = getSocket();

		return { socket, udp };
	}

	let services: Services;

	beforeEach(() => {
		services = makeServices();
	});

	describe('send methods', () => {
		it('sendRaw delegates to socket.send with configured host/port', () => {
			const customServices = makeServices('hostX', 5555);
			const buf = Buffer.from([1, 2, 3]);

			customServices.udp.sendRaw(buf);

			expect(customServices.socket.send).toHaveBeenCalledWith(buf, 5555, 'hostX');
		});

		it('demoPing sends the DEADBEEF demo packet to configured host/port', () => {
			const customServices = makeServices('hostY', 9999);

			customServices.udp.demoPing();

			expect(customServices.socket.send).toHaveBeenCalledWith(Buffer.from([0xde, 0xad, 0xbe, 0xef]), 9999, 'hostY');
		});

		it('sendRaw forwards zero-length buffers without throwing', () => {
			const customServices = makeServices('h', 1);
			const empty = Buffer.from([]);

			expect(() => customServices.udp.sendRaw(empty)).not.toThrow();
			expect(customServices.socket.send).toHaveBeenCalledWith(empty, 1, 'h');
		});

		it('sendGetSerial sends correct packet and logs tx message', () => {
			const customServices = makeServices('z21-host', 4242);

			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

			customServices.udp.sendGetSerial();

			// Packet is DataLen=0x0004, Header=0x0010 -> bytes [04 00 10 00] little-endian
			const expectedPkt = Buffer.alloc(4);
			expectedPkt.writeUInt16LE(0x0004, 0);
			expectedPkt.writeUInt16LE(0x0010, 2);

			expect(customServices.socket.send).toHaveBeenCalledWith(expectedPkt, 4242, 'z21-host');

			expect(consoleSpy).toHaveBeenCalledWith('[udp] tx GET_SERIAL ->', 'z21-host:4242', expectedPkt.toString('hex'));

			consoleSpy.mockRestore();
		});
	});

	describe('lifecycle methods', () => {
		it('start binds socket and logs errors emitted by socket', () => {
			const svc = makeServices();
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			svc.udp.start();

			expect(svc.socket.bind).toHaveBeenCalled();

			const errHandler = svc.socket.on.mock.calls.find((c: any[]) => c[0] === 'error')?.[1];
			expect(errHandler).toBeDefined();

			const err = new Error('udp failure');
			errHandler(err);
			expect(consoleSpy).toHaveBeenCalledWith('[udp] error', err);

			consoleSpy.mockRestore();
		});

		it('emits serial rx when a serial reply is received', () => {
			const svc = makeServices();
			// start registers the 'message' handler on the mocked socket
			svc.udp.start();

			// find the message handler
			const msgHandler = svc.socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
			expect(msgHandler).toBeDefined();

			// listen for 'rx' events
			const rxSpy = vi.fn();
			svc.udp.on('rx', rxSpy);

			// Construct a buffer representing a serial reply: len=0x0008, header=0x0010, serial=0x12345678
			const buf = Buffer.alloc(8);
			buf.writeUInt16LE(0x0008, 0);
			buf.writeUInt16LE(0x0010, 2);
			buf.writeUInt32LE(0x12345678, 4);

			const rinfo = { address: '1.2.3.4', port: 12345 };

			// invoke the handler as if a message arrived
			msgHandler(buf, rinfo);

			expect(rxSpy).toHaveBeenCalled();
			// validate the payload shape and values
			const payload = rxSpy.mock.calls[0][0];
			expect(payload.type).toBe('serial');
			expect(payload.serial).toBe(0x12345678);
			expect(payload.header).toBe(0x0010);
			expect(payload.from).toEqual({ address: '1.2.3.4', port: 12345 });
		});

		it('stop closes the socket without logging when close succeeds', () => {
			const svc = makeServices();

			svc.udp.stop();

			expect(svc.socket.close).toHaveBeenCalled();
		});

		it('stop logs a socket close error when socket.close throws', () => {
			const svc = makeServices();
			svc.socket.close.mockImplementation(() => {
				throw new Error('boom');
			});

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			svc.udp.stop();

			expect(consoleSpy).toHaveBeenCalledWith('[udp] socket close error');

			consoleSpy.mockRestore();
		});
	});
});
