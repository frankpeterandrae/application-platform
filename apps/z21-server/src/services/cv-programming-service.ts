/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21CommandService, Z21Event } from '@application-platform/z21';

/**
 * Service for managing CV (Configuration Variable) programming operations.
 * Handles queuing, timeouts, and response processing for CV read/write operations.
 */
export class CvProgrammingService {
	private readonly queue: Array<() => void> = [];
	private inFlight: {
		cvAdress: number;
		resolve: (value: { cvAdress: number; cvValue: number }) => void;
		reject: (reason?: Error) => void;
		timeout: NodeJS.Timeout;
	} | null = null;

	/**
	 * Creates a new CV programming service.
	 * @param z21 - Z21 command service for sending CV commands
	 * @param timeoutMs - Timeout in milliseconds for CV operations
	 */
	constructor(
		private readonly z21: Z21CommandService,
		private readonly timeoutMs: number
	) {}

	/**
	 * Handles Z21 events related to CV programming.
	 * @param event - Z21 event to process
	 */
	public onEvent(event: Z21Event): void {
		if (!this.inFlight) {
			return;
		}

		if (event.type === 'event.cv.result') {
			if (event.cv !== this.inFlight.cvAdress) {
				// CV address mismatch - ignore this response
				return;
			}

			this.succeed({
				cvAdress: event.cv,
				cvValue: event.value
			});

			return;
		}

		if (event.type === 'event.cv.nack') {
			if (event.payload.shortCircuit) {
				this.fail(new Error('CV short circuit detected'));
				return;
			} else {
				this.fail(new Error('CV programming NACK received'));
				return;
			}
		}

		// Ignore all other event types
	}

	/**
	 * Reads a CV value from the programming track.
	 * @param cvAdress - CV address to read (1-1024)
	 * @returns Promise that resolves with CV address and value
	 */
	public readCv(cvAdress: number): Promise<{ cvAdress: number; cvValue: number }> {
		return this.enqueue(cvAdress, () => this.z21.sendCvRead(cvAdress));
	}

	/**
	 * Writes a CV value to the programming track.
	 * @param cvAdress - CV address to write (1-1024)
	 * @param cvValue - CV value to write (0-255)
	 * @returns Promise that resolves when write is complete
	 */
	public writeCv(cvAdress: number, cvValue: number): Promise<void> {
		return this.enqueue(cvAdress, () => this.z21.sendCvWrite(cvAdress, cvValue)).then(() => undefined);
	}

	/**
	 * Enqueues a CV operation.
	 * @param cvAdress - CV address
	 * @param send - Function to send the CV command
	 * @returns Promise that resolves with CV address and value
	 */
	private enqueue(cvAdress: number, send: () => void): Promise<{ cvAdress: number; cvValue: number }> {
		return new Promise((resolve, reject) => {
			const task = (): void => {
				if (this.inFlight) {
					return;
				}

				const timeout = setTimeout(() => {
					this.fail(new Error('CV programming operation timed out'));
				}, this.timeoutMs);

				this.inFlight = {
					cvAdress,
					resolve,
					reject,
					timeout
				};

				send();
			};

			this.queue.push(task);
			this.drain();
		});
	}

	/**
	 * Processes the next queued CV operation if none is in flight.
	 */
	private drain(): void {
		if (this.inFlight) {
			return;
		}
		const next = this.queue.shift();
		if (next) {
			next();
		}
	}

	/**
	 * Marks the current CV operation as failed.
	 * @param error - Error that caused the failure
	 */
	private fail(error: Error): void {
		if (!this.inFlight) {
			return;
		}

		clearTimeout(this.inFlight.timeout);
		this.inFlight.reject(error);
		this.inFlight = null;
		this.drain();
	}

	/**
	 * Marks the current CV operation as successful.
	 * @param param - CV address and value result
	 */
	private succeed(param: { cvAdress: number; cvValue: number }): void {
		if (!this.inFlight) {
			return;
		}

		clearTimeout(this.inFlight.timeout);
		this.inFlight.resolve(param);
		this.inFlight = null;
		this.drain();
	}
}
