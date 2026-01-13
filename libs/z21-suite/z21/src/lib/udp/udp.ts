/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import dgram from 'node:dgram';
import { EventEmitter } from 'node:events';

export type Z21RxPayload =
	| { type: 'serial'; serial: number; header: number; len: number; rawHex: string; from: { address: string; port: number } }
	| { type: 'raw'; header: number; len: number; rawHex: string; from: { address: string; port: number } };

/**
 * Thin Z21 UDP client that:
 * - Listens for Z21 datagrams, parses them to datasets and higher-level events
 * - Emits an 'rx' event with a normalized payload shape
 * - Sends common Z21 commands (serial, broadcast flags, system state)
 */
export class Z21Udp extends EventEmitter {
	private readonly sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });

	/**
	 * @param host - Z21 central hostname/IP to send commands to
	 * @param port - UDP port of the Z21 central
	 */
	constructor(
		private readonly host: string,
		private readonly port: number
	) {
		super();
	}

	/**
	 * Starts the UDP socket and begins listening for inbound Z21 datagrams.
	 */
	public start(listenPort = 21105): void {
		// eslint-disable-next-line no-console
		this.sock.on('error', (err) => console.error('[udp] error', err));

		this.sock.on('listening', () => {
			const a = this.sock.address();
			// eslint-disable-next-line no-console
			console.log('[udp] listening on', a);
		});

		this.sock.on('message', (msg, rinfo) => {
			// Z21 dataset: [lenLE16][headerLE16][data...]
			if (msg.length < 4) return;

			const len = msg.readUInt16LE(0);
			const header = msg.readUInt16LE(2);
			const rawHex = msg.toString('hex');
			const from = { address: rinfo.address, port: rinfo.port };

			// Serial number reply: len=0x08, header=0x0010, data=uint32LE
			if (len === 0x0008 && header === 0x0010 && msg.length >= 8) {
				const serial = msg.readUInt32LE(4);
				this.emit('rx', {
					type: 'serial',
					serial,
					header,
					len,
					rawHex,
					from
				});
				return;
			}

			// Fallback: raw dataset
			this.emit('rx', { type: 'raw', header, len, rawHex, from } satisfies Z21RxPayload);
		});

		this.sock.bind(listenPort);
	}

	/**
	 * Stops the UDP socket, logging if close fails.
	 */
	public stop(): void {
		try {
			this.sock.close();
		} catch {
			// eslint-disable-next-line no-console
			console.error('[udp] socket close error');
		}
	}

	/**
	 * Sends a raw UDP buffer to the configured Z21 host/port.
	 * @param buf Raw datagram payload
	 */
	public sendRaw(buf: Buffer): void {
		this.sock.send(buf, this.port, this.host);
	}

	/**
	 * Sends a demo ping packet (0xDEADBEEF) to the Z21 central.
	 */
	public demoPing(): void {
		this.sendRaw(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
	}

	/**
	 * Sends a GET_SERIAL command to the Z21 central.
	 */
	public sendGetSerial(): void {
		// DataLen=0x0004, Header=0x0010
		const pkt = Buffer.alloc(4);
		pkt.writeUInt16LE(0x0004, 0);
		pkt.writeUInt16LE(0x0010, 2);
		// eslint-disable-next-line no-console
		console.log('[udp] tx GET_SERIAL ->', this.host + ':' + this.port, pkt.toString('hex'));
		this.sendRaw(pkt);
	}
}
