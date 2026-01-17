/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import * as dgram from 'node:dgram';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dgram module and related z21 helpers early so imports are replaced
vi.mock('node:dgram', () => {
	const socket = {
		on: vi.fn(),
		bind: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		address: vi.fn(() => ({ address: '0.0.0.0', port: 21105 }))
	};
	return { createSocket: vi.fn(() => socket) };
});

// Mock the same module path used by the implementation imports
vi.mock('../codec/codec', () => ({ parseZ21Datagram: vi.fn(() => []) }));

import { parseZ21Datagram } from '../codec/codec';
import { Z21BroadcastFlag, Z21LanHeader } from '../constants';

import { Z21Udp } from './udp';

const getSocket = (): any => (dgram.createSocket as any).mock.results[0].value;

describe('Z21Udp', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('binds UDP socket on start with default port and wires listeners', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();

		const socket = getSocket();
		expect(socket.on).toHaveBeenCalledWith('error', expect.any(Function));
		expect(socket.on).toHaveBeenCalledWith('listening', expect.any(Function));
		expect(socket.on).toHaveBeenCalledWith('message', expect.any(Function));
		expect(socket.bind).toHaveBeenCalledWith(21105);
	});

	it('emits serial rx payloads when header 0x0010 is received', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const msg = Buffer.alloc(8);
		msg.writeUInt16LE(0x0008, 0);
		msg.writeUInt16LE(Z21LanHeader.LAN_GET_SERIAL_NUMBER, 2);
		msg.writeUInt32LE(0xdeadbeef, 4);
		const rx = vi.fn();
		udp.on('rx', rx);

		messageHandler?.(msg, { address: '1.2.3.4', port: 21105 } as any);

		expect(rx).toHaveBeenCalledWith({
			type: 'serial',
			serial: 0xdeadbeef,
			header: Z21LanHeader.LAN_GET_SERIAL_NUMBER,
			len: 0x0008,
			rawHex: msg.toString('hex'),
			from: { address: '1.2.3.4', port: 21105 }
		});
	});

	it('emits datasets rx payloads with parsed datasets', () => {
		(parseZ21Datagram as any).mockReturnValue([{ kind: 'system.state', state: Uint8Array.from([1, 2, 3, 4]) }]);
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const msg = Buffer.from([
			0x08,
			0x00, // len
			0x34,
			0x12, // header 0x1234
			0xaa,
			0xbb,
			0xcc,
			0xdd
		]);
		const rx = vi.fn();
		udp.on('rx', rx);

		messageHandler?.(msg, { address: '1.2.3.4', port: 21105 } as any);

		expect(rx).toHaveBeenCalledWith({
			type: 'datasets',
			header: 0x1234,
			len: 0x0008,
			rawHex: msg.toString('hex'),
			from: { address: '1.2.3.4', port: 21105 },
			datasets: [{ kind: 'system.state', state: Uint8Array.from([1, 2, 3, 4]) }]
		});
	});

	it('ignores messages shorter than 4 bytes', () => {
		const udp = new Z21Udp('host', 1234);
		udp.start();
		const socket = getSocket();
		const messageHandler = socket.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const rx = vi.fn();
		udp.on('rx', rx);

		messageHandler?.(Buffer.from([0x01, 0x02]), { address: '1.2.3.4', port: 21105 } as any);

		expect(rx).not.toHaveBeenCalled();
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
		const sent = (socket.send as any).mock.calls[0][0] as Buffer;
		expect(sent.readUInt16LE(0)).toBe(0x0004);
		expect(sent.readUInt16LE(2)).toBe(Z21LanHeader.LAN_GET_SERIAL_NUMBER);
	});

	it('sendSetBroadcastFlags builds proper packet', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();
		udp.sendSetBroadcastFlags(Z21BroadcastFlag.SystemState | Z21BroadcastFlag.Basic);
		const sent = (socket.send as any).mock.calls[0][0] as Buffer;
		expect(sent.readUInt16LE(0)).toBe(0x0008);
		expect(sent.readUInt16LE(2)).toBe(Z21LanHeader.LAN_SET_BROADCASTFLAGS);
		expect(sent.readUInt32LE(4)).toBe(Z21BroadcastFlag.SystemState | Z21BroadcastFlag.Basic);
	});

	it('sendSystemStateGetData builds proper packet', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();
		udp.sendSystemStateGetData();
		const sent = (socket.send as any).mock.calls[0][0] as Buffer;
		expect(sent.readUInt16LE(0)).toBe(0x0004);
		expect(sent.readUInt16LE(2)).toBe(Z21LanHeader.LAN_SYSTEMSTATE_DATAGET);
	});

	it('stop closes socket gracefully', () => {
		const udp = new Z21Udp('h', 1);
		const socket = getSocket();
		udp.stop();
		expect(socket.close as any).toHaveBeenCalled();
		expect(socket.close).toHaveBeenCalled();
	});
});
