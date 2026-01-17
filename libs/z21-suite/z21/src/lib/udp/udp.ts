/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import * as dgram from 'node:dgram';
import { EventEmitter } from 'node:events';

import { Z21LanHeader, type Logger } from '@application-platform/z21-shared';

import { type Z21BroadcastFlag } from '../constants';
import { encodeXBusLanFrame } from '../helper/x-bus-encoder';

export type Z21UdpFrom = { address: string; port: number };

export type Z21UdpDatagram = {
	from: Z21UdpFrom;
	raw: Buffer;
	rawHex: string;
};

/**
 * Converts a Uint8Array to a hex string representation, truncating if it exceeds maxBytes.
 *
 * @param buf - Input byte array
 * @param maxBytes - Maximum number of bytes to convert (default 512)
 *
 * @returns Hex string representation of the byte array
 */
function toHex(buf: Uint8Array, maxBytes = 512): string {
	const len = Math.min(buf.length, maxBytes);
	let out = '';
	for (let i = 0; i < len; i++) out += buf[i].toString(16).padStart(2, '0');
	return buf.length > maxBytes ? out + '…' : out;
}

/**
 * Thin Z21 UDP client that:
 * - Listens for Z21 datagrams, parses them to datasets and higher-level events
 * - Emits an 'rx' event with a normalized payload shape
 * - Sends common Z21 commands (serial, broadcast flags, system state)
 */
export class Z21Udp extends EventEmitter {
	private sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
	private started = false;

	/**
	 * @param host Z21 central hostname/IP to send commands to
	 * @param port UDP port of the Z21 central
	 * @param logger Logger instance for debug/info/warn/error logging
	 */
	constructor(
		private readonly host: string,
		private readonly port: number,
		private readonly logger: Logger
	) {
		super();
	}

	/**
	 * Starts the UDP socket and begins listening for inbound Z21 datagrams.
	 * @param listenPort Local UDP port to bind to (default 21105)
	 */
	public start(listenPort = 21105): void {
		if (this.started) {
			return;
		}
		this.started = true;

		this.sock.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
			const from = { address: rinfo.address, port: rinfo.port };
			const rawHex = toHex(msg);

			this.logger.debug('[udp] rx <-', { from, len: msg.length, hex: rawHex });

			this.emit('datagram', { from, raw: msg, rawHex } satisfies Z21UdpDatagram);
		});

		this.sock.bind(listenPort);
	}

	/**
	 * Stops the UDP socket, logging if close fails.
	 */
	public stop(): void {
		if (!this.started) {
			return;
		}

		this.started = false;

		try {
			this.sock.close();
		} catch (err) {
			this.emit('error', err instanceof Error ? err : new Error(String(err)));
		} finally {
			// Recreate socket so start() works again after stop()
			this.sock.removeAllListeners();
			this.sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		}
	}

	/**
	 * Sends a raw UDP buffer to the configured Z21 host/port.
	 * @param buf Raw datagram payload
	 */
	public sendRaw(buf: Buffer): void {
		this.logger.debug('[udp] tx', { from: { address: this.host, port: this.port }, len: buf.length, hex: toHex(buf) });

		this.sock.send(buf, this.port, this.host);
	}

	/**
	 * Requests the Z21 serial number (Header 0x0010, DataLen 0x0004).
	 */
	public sendGetSerial(): void {
		const pkt = encodeXBusLanFrame(Z21LanHeader.LAN_GET_SERIAL_NUMBER);

		// eslint-disable-next-line no-console
		console.log('[udp] tx GET_SERIAL ->', this.host + ':' + this.port, pkt.toString('hex'));
		this.sendRaw(pkt);
	}

	/**
	 * Sets Z21 broadcast flags (Header 0x0050).
	 * @param flags Bitmask of broadcast flags to enable
	 */
	public sendSetBroadcastFlags(flags: Z21BroadcastFlag): void {
		const payload = Buffer.alloc(4);
		payload.writeUInt32LE(flags >>> 0, 0);
		const pkt = encodeXBusLanFrame(Z21LanHeader.LAN_SET_BROADCASTFLAGS, payload);

		// eslint-disable-next-line no-console
		console.log('[udp] tx SET_BROADCAST_FLAGS ->', this.host + ':' + this.port, pkt.toString('hex'));
		this.sendRaw(pkt);
	}

	/**
	 * Requests the current system state snapshot (Header 0x0085).
	 */
	public sendSystemStateGetData(): void {
		const pkt = encodeXBusLanFrame(Z21LanHeader.LAN_SYSTEMSTATE_DATAGET);

		// eslint-disable-next-line no-console
		console.log('[udp] tx SYSTEM_STATE_GET_DATA ->', this.host + ':' + this.port, pkt.toString('hex'));
		this.sendRaw(pkt);
	}
}
