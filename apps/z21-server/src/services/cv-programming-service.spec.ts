/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DeepMock, DeepMocked } from '@application-platform/shared-node-test';
import type { Z21CommandService } from '@application-platform/z21';
import { Z21Event } from '@application-platform/z21-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CvProgrammingService } from './cv-programming-service';

describe('CvProgrammingService', () => {
	let service: CvProgrammingService;
	let z21CommandService: DeepMocked<Z21CommandService>;

	beforeEach(() => {
		vi.useFakeTimers();
		z21CommandService = DeepMock<Z21CommandService>();
		service = new CvProgrammingService(z21CommandService as any, 1000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('readCv', () => {
		it('sends CV read command and resolves on success', async () => {
			const promise = service.readCv(29);

			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(29);

			const event: Z21Event = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 29,
					value: 42,
					raw: []
				}
			};

			service.onEvent(event);

			const result = await promise;
			expect(result).toEqual({ cvAdress: 29, cvValue: 42 });
		});

		it('rejects with timeout error when no response received', async () => {
			const promise = service.readCv(29);

			vi.advanceTimersByTime(1000);

			await expect(promise).rejects.toThrow('CV programming operation timed out');
		});

		it('rejects with NACK error', async () => {
			const promise = service.readCv(29);

			const event: Z21Event = {
				event: 'programming.event.cv.nack',
				payload: { shortCircuit: false, raw: [] }
			};

			service.onEvent(event);

			await expect(promise).rejects.toThrow('CV programming NACK received');
		});

		it('rejects with shortCircuit circuit error', async () => {
			const promise = service.readCv(29);

			const event: Z21Event = {
				event: 'programming.event.cv.nack',
				payload: { shortCircuit: true, raw: [] }
			};

			service.onEvent(event);

			await expect(promise).rejects.toThrow('CV shortCircuit circuit detected');
		});

		it('ignores CV result with wrong address', async () => {
			const promise = service.readCv(29);

			const wrongEvent: Z21Event = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 1,
					value: 3,
					raw: []
				}
			};

			service.onEvent(wrongEvent);

			vi.advanceTimersByTime(500);

			const correctEvent: Z21Event = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 29,
					value: 42,
					raw: []
				}
			};

			service.onEvent(correctEvent);

			const result = await promise;
			expect(result).toEqual({ cvAdress: 29, cvValue: 42 });
		});

		it('queues multiple CV read operations', async () => {
			const promise1 = service.readCv(1);
			const promise2 = service.readCv(17);
			const promise3 = service.readCv(29);

			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(1);
			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(1);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1, value: 3, raw: [] } });

			await promise1;

			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(2);
			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(17);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 17, value: 192, raw: [] } });

			await promise2;

			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(3);
			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(29);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 29, value: 42, raw: [] } });

			await promise3;
		});

		it('handles timeout in queue correctly', async () => {
			const promise1 = service.readCv(1);
			const promise2 = service.readCv(17);

			vi.advanceTimersByTime(1000);

			await expect(promise1).rejects.toThrow('CV programming operation timed out');

			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(2);
			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(17);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 17, value: 192, raw: [] } });

			await expect(promise2).resolves.toEqual({ cvAdress: 17, cvValue: 192 });
		});

		it('returns CV value 0', async () => {
			const promise = service.readCv(1);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1, value: 0, raw: [] } });

			const result = await promise;
			expect(result).toEqual({ cvAdress: 1, cvValue: 0 });
		});

		it('returns CV value 255', async () => {
			const promise = service.readCv(100);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 100, value: 255, raw: [] } });

			const result = await promise;
			expect(result).toEqual({ cvAdress: 100, cvValue: 255 });
		});

		it('handles CV address 1', async () => {
			const promise = service.readCv(1);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1, value: 3, raw: [] } });

			await expect(promise).resolves.toEqual({ cvAdress: 1, cvValue: 3 });
		});

		it('handles CV address 1024', async () => {
			const promise = service.readCv(1024);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1024, value: 100, raw: [] } });

			await expect(promise).resolves.toEqual({ cvAdress: 1024, cvValue: 100 });
		});
	});

	describe('writeCv', () => {
		it('sends CV write command and resolves on success', async () => {
			const promise = service.writeCv(29, 14);

			expect(z21CommandService.sendCvWrite).toHaveBeenCalledWith(29, 14);

			const event: Z21Event = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 29,
					value: 14,
					raw: []
				}
			};

			service.onEvent(event);

			await expect(promise).resolves.toBeUndefined();
		});

		it('rejects with timeout error when no response received', async () => {
			const promise = service.writeCv(29, 14);

			vi.advanceTimersByTime(1000);

			await expect(promise).rejects.toThrow('CV programming operation timed out');
		});

		it('rejects with NACK error', async () => {
			const promise = service.writeCv(29, 14);

			const event: Z21Event = {
				event: 'programming.event.cv.nack',
				payload: { shortCircuit: false, raw: [] }
			};

			service.onEvent(event);

			await expect(promise).rejects.toThrow('CV programming NACK received');
		});

		it('rejects with shortCircuit circuit error', async () => {
			const promise = service.writeCv(29, 14);

			const event: Z21Event = {
				event: 'programming.event.cv.nack',
				payload: { shortCircuit: true, raw: [] }
			};

			service.onEvent(event);

			await expect(promise).rejects.toThrow('CV shortCircuit circuit detected');
		});

		it('writes CV value 0', async () => {
			const promise = service.writeCv(10, 0);

			expect(z21CommandService.sendCvWrite).toHaveBeenCalledWith(10, 0);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 10, value: 0, raw: [] } });

			await expect(promise).resolves.toBeUndefined();
		});

		it('writes CV value 255', async () => {
			const promise = service.writeCv(100, 255);

			expect(z21CommandService.sendCvWrite).toHaveBeenCalledWith(100, 255);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 100, value: 255, raw: [] } });

			await expect(promise).resolves.toBeUndefined();
		});

		it('queues multiple CV write operations', async () => {
			const promise1 = service.writeCv(1, 3);
			const promise2 = service.writeCv(17, 192);

			expect(z21CommandService.sendCvWrite).toHaveBeenCalledTimes(1);
			expect(z21CommandService.sendCvWrite).toHaveBeenCalledWith(1, 3);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1, value: 3, raw: [] } });

			await promise1;

			expect(z21CommandService.sendCvWrite).toHaveBeenCalledTimes(2);
			expect(z21CommandService.sendCvWrite).toHaveBeenCalledWith(17, 192);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 17, value: 192, raw: [] } });

			await promise2;
		});
	});

	describe('onEvent', () => {
		it('ignores events when no operation in flight', () => {
			const event: Z21Event = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 29,
					value: 42,
					raw: []
				}
			};

			expect(() => service.onEvent(event)).not.toThrow();
		});

		it('ignores non-CV events', async () => {
			const promise = service.readCv(29);

			const event: Z21Event = {
				event: 'system.event.track.power',
				payload: {
					powerOn: true,
					programmingMode: false,
					emergencyStop: false,
					shortCircuit: false,
					raw: []
				}
			};

			service.onEvent(event);

			vi.advanceTimersByTime(500);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 29, value: 42, raw: [] } });

			await expect(promise).resolves.toEqual({ cvAdress: 29, cvValue: 42 });
		});

		it('ignores loco info events', async () => {
			const promise = service.readCv(29);

			const event: Z21Event = {
				event: 'loco.event.info',
				payload: {
					addr: 3,
					speed: 0,
					speedSteps: 128,
					direction: 'FWD',
					emergencyStop: false,
					isOccupied: false,
					isMmLoco: false,
					isDoubleTraction: false,
					isSmartsearch: false,
					functionMap: {},
					raw: []
				}
			};

			service.onEvent(event);

			vi.advanceTimersByTime(500);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 29, value: 42, raw: [] } });

			await expect(promise).resolves.toEqual({ cvAdress: 29, cvValue: 42 });
		});
	});

	describe('timeout handling', () => {
		it('clears timeout after successful operation', async () => {
			const promise = service.readCv(29);

			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 29, value: 42, raw: [] } });

			await promise;

			// Assert that we actually sent the CV read command and operation completed
			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(29);
			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(2000);

			// Should not throw because timeout was cleared
		});

		it('uses configured timeout value', async () => {
			const customService = new CvProgrammingService(z21CommandService as any, 2000);

			const promise = customService.readCv(29);

			vi.advanceTimersByTime(1999);

			// Should not have rejected yet
			expect(z21CommandService.sendCvRead).toHaveBeenCalledWith(29);

			vi.advanceTimersByTime(1);

			await expect(promise).rejects.toThrow('CV programming operation timed out');
		}, 10000);
	});

	describe('error handling', () => {
		it('handles NACK before result', async () => {
			const promise = service.readCv(29);

			service.onEvent({ event: 'programming.event.cv.nack', payload: { shortCircuit: false, raw: [] } });

			await expect(promise).rejects.toThrow('CV programming NACK received');

			// Late result should be ignored
			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 29, value: 42, raw: [] } });
		});

		it('handles multiple NACKs gracefully', async () => {
			const promise = service.readCv(29);

			service.onEvent({ event: 'programming.event.cv.nack', payload: { shortCircuit: false, raw: [] } });
			service.onEvent({ event: 'programming.event.cv.nack', payload: { shortCircuit: true, raw: [] } });

			await expect(promise).rejects.toThrow('CV programming NACK received');
		});
	});

	describe('internal edge cases', () => {
		it('handles drain when already processing', async () => {
			// Start first operation
			const promise1 = service.readCv(1);

			// Queue second operation
			const promise2 = service.readCv(2);

			// First operation is in flight, drain should not start second
			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(1);

			// Complete first operation
			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1, value: 3, raw: [] } });

			await promise1;

			// Now drain should automatically start second operation
			expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(2);

			// Complete second operation
			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 2, value: 5, raw: [] } });

			await promise2;
		});

		it('handles succeed when no operation in flight (defensive programming)', () => {
			// This tests the defensive check in succeed() - line 147-148
			// Normally this should never happen, but the code defends against it
			expect(() => {
				// Testing internal method
				service['succeed']({ cvAdress: 99, cvValue: 99 });
			}).not.toThrow();
		});

		it('handles fail when no operation in flight (defensive programming)', () => {
			// This tests the defensive check in fail() - line 132-133
			// Normally this should never happen, but the code defends against it
			expect(() => {
				// Testing internal method
				service['fail'](new Error('test error'));
			}).not.toThrow();
		});

		it('handles enqueue task execution when operation already in flight', () => {
			// This tests line 91-92 - the early return in enqueue's task function
			// Start first operation (now in flight)
			const promise1 = service.readCv(1);

			// Manually trigger the task while first is still in flight
			// Accessing internal queue for testing
			const queuedTask = service['queue'][0];

			if (queuedTask) {
				// Call the task - it should return early because inFlight is set
				queuedTask();

				// Should still only have one sendCvRead call (the first one)
				expect(z21CommandService.sendCvRead).toHaveBeenCalledTimes(1);
			}

			// Complete the operation
			service.onEvent({ event: 'programming.event.cv.result', payload: { cv: 1, value: 3, raw: [] } });

			return promise1;
		});
	});
});
