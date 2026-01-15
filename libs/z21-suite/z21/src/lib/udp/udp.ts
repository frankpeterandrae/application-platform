/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import * as dgram from 'node:dgram';
import { EventEmitter } from 'node:events';

import { parseZ21Datagram } from '../z21/codec';
import { dataToEvent } from '../z21/event';

/**
 * Thin Z21 UDP client that:
 * - Listens for Z21 datagrams, parses them to datasets and higher-level events
 * - Emits an 'rx' event with a normalized payload shape
 * - Sends common Z21 commands (serial, broadcast flags, system state)
 */
export class Z21Udp extends EventEmitter {
	private readonly sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });

	/**
	 * @param host Z21 central hostname/IP to send commands to
	 * @param port UDP port of the Z21 central
	 */
	constructor(
		private readonly host: string,
		private readonly port: number
	) {
		super();
	}

	/**
	 * Starts the UDP socket and begins listening for inbound Z21 datagrams.
	 * @param listenPort Local UDP port to bind to (default 21105)
	 */
	public start(listenPort = 21105): void {
		// eslint-disable-next-line no-console
		this.sock.on('error', (err: Error) => console.error('[udp] error', err));

		this.sock.on('listening', () => {
			const a = this.sock.address();
			// eslint-disable-next-line no-console
			console.log('[udp] listening on', a);
		});

		this.sock.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
			// eslint-disable-next-line no-console
			console.log('[udp] rx raw', rinfo.address + ':' + rinfo.port, 'len', msg.length, 'hex', msg.toString('hex'));

			// Z21 dataset: [lenLE16][headerLE16][data...]
			if (msg.length < 4) return;

			const len = msg.readUInt16LE(0);
			const header = msg.readUInt16LE(2);
			const rawHex = msg.toString('hex');
			const from = { address: rinfo.address, port: rinfo.port };

			// 1) Datagram -> Datasets
			const datasets = parseZ21Datagram(msg);

			// 2) Datasets -> Domain Events (track.power, system.state, ...)
			const events = datasets.flatMap(dataToEvent);

			// Optional: Debug
			// eslint-disable-next-line no-console
			console.log('[udp] rx datasets=', datasets.length, 'events=', events.length, 'hex', rawHex);

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

			// 3) EIN rx-Event hochreichen (einheitlich)
			this.emit('rx', {
				type: 'datasets',
				header: msg.length >= 4 ? msg.readUInt16LE(2) : 0,
				len: msg.length >= 2 ? msg.readUInt16LE(0) : msg.length,
				rawHex,
				from,
				datasets,
				events
			});
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
	 * Sends a demo payload (0xDEADBEEF).
	 */
	public demoPing(): void {
		this.sendRaw(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
	}

	/**
	 * Requests the Z21 serial number (Header 0x0010, DataLen 0x0004).
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

	/**
	 * Sets Z21 broadcast flags (Header 0x0050).
	 * @param flags Bitmask of broadcast flags to enable
	 */
	public sendSetBroadcastFlags(flags: number): void {
		const ptk = Buffer.alloc(8);
		ptk.writeUInt16LE(0x0008, 0); // DataLen=0x0008
		ptk.writeUInt16LE(0x0050, 2);
		ptk.writeUInt32LE(flags >>> 0, 4); // Flags

		// eslint-disable-next-line no-console
		console.log('[udp] tx SET_BROADCAST_FLAGS ->', this.host + ':' + this.port, ptk.toString('hex'));
		this.sendRaw(ptk);
	}

	/**
	 * Requests the current system state snapshot (Header 0x0085).
	 */
	public sendSystemStateGetData(): void {
		const pkt = Buffer.alloc(4);
		pkt.writeUInt16LE(0x0004, 0);
		pkt.writeUInt16LE(0x0085, 2); // Header=0x0085

		// eslint-disable-next-line no-console
		console.log('[udp] tx SYSTEM_STATE_GET_DATA ->', this.host + ':' + this.port, pkt.toString('hex'));
		this.sendRaw(pkt);
	}
}
