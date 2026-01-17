/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import * as dgram from 'node:dgram';

import { Z21LanHeader } from '@application-platform/z21-shared';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { Z21BroadcastFlag } from '../constants';

import { Z21Udp } from './udp';
// Mock dgram module and related z21 helpers early so imports are replaced
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

const getSocket = (): any => (dgram.createSocket as any).mock.results[0].value;

describe('Z21Udp', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('binds UDP socket on start with default port and wires listeners', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();

		const socket = getSocket();
		expect(socket.on).toHaveBeenCalledWith('message', expect.any(Function));
		expect(socket.bind).toHaveBeenCalledWith(21105);
	});

	it('allows custom listen port', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start(54321);

		const socket = getSocket();
		expect(socket.bind).toHaveBeenCalledWith(54321);
	});

	it('emits datagram event with raw buffer and sender info', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const msg = Buffer.from([0x04, 0x00, 0x10, 0x00]);
		const datagram = vi.fn();
		udp.on('datagram', datagram);

		messageHandler?.(msg, { address: '192.168.0.111', port: 21105 } as any);

		expect(datagram).toHaveBeenCalledWith({
			from: { address: '192.168.0.111', port: 21105 },
			raw: msg,
			rawHex: '04001000'
		});
	});

	it('emits datagram for serial number response', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const msg = Buffer.alloc(8);
		msg.writeUInt16LE(0x0008, 0);
		msg.writeUInt16LE(Z21LanHeader.LAN_GET_SERIAL_NUMBER, 2);
		msg.writeUInt32LE(0xdeadbeef, 4);
		const datagram = vi.fn();
		udp.on('datagram', datagram);

		messageHandler?.(msg, { address: '10.0.0.1', port: 21105 } as any);

		expect(datagram).toHaveBeenCalledWith({
			from: { address: '10.0.0.1', port: 21105 },
			raw: msg,
			rawHex: expect.any(String)
		});
	});

	it('emits datagram for any message length', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const datagram = vi.fn();
		udp.on('datagram', datagram);

		messageHandler?.(Buffer.from([0x01]), { address: '1.2.3.4', port: 21105 } as any);

		expect(datagram).toHaveBeenCalledWith({
			from: { address: '1.2.3.4', port: 21105 },
			raw: Buffer.from([0x01]),
			rawHex: '01'
		});
	});

	it('converts buffer to hex string correctly', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const msg = Buffer.from([0xaa, 0xbb, 0xcc, 0xdd]);
		const datagram = vi.fn();
		udp.on('datagram', datagram);

		messageHandler?.(msg, { address: '1.2.3.4', port: 21105 } as any);

		expect(datagram).toHaveBeenCalledWith(expect.objectContaining({ rawHex: 'aabbccdd' }));
	});

	it('does not start twice', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const bindCallCount = (socket.bind as Mock).mock.calls.length;

		udp.start();

		expect((socket.bind as Mock).mock.calls.length).toBe(bindCallCount);
	});

	it('sendRaw delegates to socket.send with configured host/port', () => {
		const udp = new Z21Udp('hostX', 5555);
		const socket = getSocket();
		const buf = Buffer.from([1, 2, 3]);

		udp.sendRaw(buf);

		expect(socket.send).toHaveBeenCalledWith(buf, 5555, 'hostX');
	});

	it('sendGetSerial builds proper packet', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();

		udp.sendGetSerial();

		const sent = (socket.send as Mock).mock.calls[0][0] as Buffer;
		expect(sent.readUInt16LE(0)).toBe(0x0004);
		expect(sent.readUInt16LE(2)).toBe(Z21LanHeader.LAN_GET_SERIAL_NUMBER);
	});

	it('sendSetBroadcastFlags builds proper packet', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();

		udp.sendSetBroadcastFlags(Z21BroadcastFlag.SystemState | Z21BroadcastFlag.Basic);

		const sent = (socket.send as Mock).mock.calls[0][0] as Buffer;
		expect(sent.readUInt16LE(0)).toBe(0x0008);
		expect(sent.readUInt16LE(2)).toBe(Z21LanHeader.LAN_SET_BROADCASTFLAGS);
		expect(sent.readUInt32LE(4)).toBe(Z21BroadcastFlag.SystemState | Z21BroadcastFlag.Basic);
	});

	it('sendSystemStateGetData builds proper packet', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();

		udp.sendSystemStateGetData();

		const sent = (socket.send as Mock).mock.calls[0][0] as Buffer;
		expect(sent.readUInt16LE(0)).toBe(0x0004);
		expect(sent.readUInt16LE(2)).toBe(Z21LanHeader.LAN_SYSTEMSTATE_DATAGET);
	});

	it('stop closes socket gracefully', () => {
		const udp = new Z21Udp('h', 1);
		udp.start();
		const socket = getSocket();

		udp.stop();

		expect(socket.close).toHaveBeenCalled();
	});

	it('stop does nothing when not started', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();

		udp.stop();

		expect(socket.close).not.toHaveBeenCalled();
	});

	it('stop removes all listeners', () => {
		const udp = new Z21Udp('h', 1);
		udp.start();
		const socket = getSocket();

		udp.stop();

		expect(socket.removeAllListeners).toHaveBeenCalled();
	});

	it('can be restarted after stop', () => {
		const udp = new Z21Udp('h', 1);
		udp.start();
		udp.stop();

		udp.start();

		const socket = getSocket();
		expect(socket.bind).toHaveBeenCalled();
	});

	it('handles different sender addresses', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const datagram = vi.fn();
		udp.on('datagram', datagram);

		messageHandler?.(Buffer.from([0x04, 0x00, 0x10, 0x00]), { address: '192.168.1.111', port: 12345 } as any);

		expect(datagram).toHaveBeenCalledWith(
			expect.objectContaining({
				from: { address: '192.168.1.111', port: 12345 }
			})
		);
	});

	it('preserves raw buffer in datagram event', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const msg = Buffer.from([0x08, 0x00, 0x40, 0x00, 0x01, 0x02, 0x03, 0x04]);
		const datagram = vi.fn();
		udp.on('datagram', datagram);

		messageHandler?.(msg, { address: '1.1.1.1', port: 21105 } as any);

		const emitted = datagram.mock.calls[0][0];
		expect(Buffer.isBuffer(emitted.raw)).toBe(true);
		expect(emitted.raw).toEqual(msg);
	});
});
