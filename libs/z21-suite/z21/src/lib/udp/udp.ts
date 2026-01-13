/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import dgram from 'node:dgram';

/**
 * Thin Z21 UDP client that:
 * - Listens for Z21 datagrams, parses them to datasets and higher-level events
 * - Emits an 'rx' event with a normalized payload shape
 * - Sends common Z21 commands (serial, broadcast flags, system state)
 */
export class Z21Udp {
	private readonly sock = dgram.createSocket('udp4');

	/**
	 * @param host - Z21 central hostname/IP to send commands to
	 * @param port - UDP port of the Z21 central
	 */
	constructor(
		private readonly host: string,
		private readonly port: number
	) {}

	/**
	 * Starts the UDP socket and begins listening for inbound Z21 datagrams.
	 */
	public start(): void {
		// eslint-disable-next-line no-console
		this.sock.on('error', (err) => console.error('[udp] error', err));

		this.sock.bind();
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
}
