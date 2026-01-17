/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TurnoutState } from '@application-platform/z21-shared';
import { describe, expect, it } from 'vitest';

import { sendUdpHex, startFakeZ21, startServerAndConnectWs, stopCtx, waitFor, waitForWsType } from '../support/e2e-helpers';

describe('server e2e', () => {
	describe('loco.message.state broadcasts', () => {
		it('broadcasts loco.message.state on real LAN_X_LOCO_INFO function toggle frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('0f004000efc735048004000000009d'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'loco.message.state');

			expect(locoState.addr).toBe(1845);
			expect(locoState.speed).toBe(0);
			expect(locoState.dir).toBe('FWD');
			expect(locoState.estop).toBe(false);
			expect(locoState.fns).toEqual({
				'0': false,
				'1': false,
				'2': false,
				'3': true,
				'4': false,
				'5': false,
				'6': false,
				'7': false,
				'8': false,
				'9': false,
				'10': false,
				'11': false,
				'12': false,
				'13': false,
				'14': false,
				'15': false,
				'16': false,
				'17': false,
				'18': false,
				'19': false,
				'20': false,
				'21': false,
				'22': false,
				'23': false,
				'24': false,
				'25': false,
				'26': false,
				'27': false,
				'28': false,
				'29': false,
				'30': false,
				'31': false
			});

			await stopCtx(ctx);
		}, 20000);
		it('broadcasts loco.message.state on real LAN_X_LOCO_INFO speed/direction change frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('0f004000efc735044315000000004f'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'loco.message.state');

			expect(locoState.addr).toBe(1845);
			expect(locoState.speed).toBe(66);
			expect(locoState.dir).toBe('REV');
			expect(locoState.estop).toBe(false);
			expect(locoState.fns).toEqual({
				'0': true,
				'1': true,
				'2': false,
				'3': true,
				'4': false,
				'5': false,
				'6': false,
				'7': false,
				'8': false,
				'9': false,
				'10': false,
				'11': false,
				'12': false,
				'13': false,
				'14': false,
				'15': false,
				'16': false,
				'17': false,
				'18': false,
				'19': false,
				'20': false,
				'21': false,
				'22': false,
				'23': false,
				'24': false,
				'25': false,
				'26': false,
				'27': false,
				'28': false,
				'29': false,
				'30': false,
				'31': false
			});

			await stopCtx(ctx);
		});

		it('broadcasts loco.message.state on real LAN_X_LOCO_INFO estop frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('15004000efc73504813500000000000000000000ad'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'loco.message.state');

			expect(locoState.addr).toBe(1845);
			expect(locoState.speed).toBe(0);
			expect(locoState.dir).toBe('FWD');
			expect(locoState.estop).toBe(true);
			expect(locoState.fns).toEqual({
				'0': true,
				'1': true,
				'2': false,
				'3': true,
				'4': false,
				'5': false,
				'6': false,
				'7': false,
				'8': false,
				'9': false,
				'10': false,
				'11': false,
				'12': false,
				'13': false,
				'14': false,
				'15': false,
				'16': false,
				'17': false,
				'18': false,
				'19': false,
				'20': false,
				'21': false,
				'22': false,
				'23': false,
				'24': false,
				'25': false,
				'26': false,
				'27': false,
				'28': false,
				'29': false,
				'30': false,
				'31': false
			});

			await stopCtx(ctx);
		});
	});

	describe('switching.message.turnout.state broadcasts', () => {
		it('broadcasts switching.message.turnout.state on real LAN_X_TURNOUT_INFO STRAIGHT frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('0900400043000c014e'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'switching.message.turnout.state');

			expect(locoState.addr).toBe(12);
			expect(locoState.state).toBe(TurnoutState.STRAIGHT);

			await stopCtx(ctx);
		}, 20000);

		it('broadcasts switching.message.turnout.state on real LAN_X_TURNOUT_INFO DIVERGING frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('0900400043000c024d'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'switching.message.turnout.state');

			expect(locoState.addr).toBe(12);
			expect(locoState.state).toBe(TurnoutState.DIVERGING);

			await stopCtx(ctx);
		}, 20000);
	});

	describe('system.message.trackpower broadcasts', () => {
		it('broadcasts system.message.trackpower on real LAN_X_BC_TRACK_POWER_ON frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('07004000610160'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'system.message.trackpower');

			expect(locoState.on).toBe(true);
			expect(locoState.short).toBe(false);

			await stopCtx(ctx);
		}, 20000);

		it('broadcasts system.message.trackpower on real LAN_X_BC_TRACK_POWER_OFF frame', async () => {
			const ctx = await startServerAndConnectWs();

			await sendUdpHex('07004000610061'); // dein funktionierendes Frame
			const locoState = await waitForWsType<any>(ctx, 'system.message.trackpower');

			expect(locoState.on).toBe(false);
			expect(locoState.short).toBe(false);

			await stopCtx(ctx);
		}, 20000);
	});

	describe('send', () => {
		it('sends LOCO_DRIVE to Z21 when UI sends loco.command.drive', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// WS command wie bei dir im Log:
			ctx.ws.send(JSON.stringify({ type: 'loco.command.drive', addr: 1845, speed: 47, dir: 'FWD', steps: 128 }));

			// warte bis UDP rausgeht
			await waitFor(() => z21.rx[0] ?? undefined, {
				label: 'z21 rx LOCO_DRIVE',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));

			// erwartetes Frame aus deinem Serverlog:
			expect(hex).toContain('0a004000e413c735b0b5');

			await z21.close();
			await stopCtx(ctx);
		});

		it('sends TURNOUT_SET to Z21 when UI sends switching.command.turnout.set', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// WS command wie bei dir im Log:
			ctx.ws.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 12, state: TurnoutState.STRAIGHT, pulseMs: 200 }));

			// warte bis UDP rausgeht
			await waitFor(() => z21.rx[0] ?? undefined, {
				label: 'z21 rx TURNOUT_SET',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));

			// erwartetes Frame aus deinem Serverlog:
			expect(hex).toContain('0900400053000ca8f7');

			await z21.close();
			await stopCtx(ctx);
		});

		it('sends TRACK_POWER ON to Z21 when UI sends system.command.trackpower.set on', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// WS command wie bei dir im Log:
			ctx.ws.send(JSON.stringify({ type: 'system.command.trackpower.set', on: true }));

			// warte bis UDP rausgeht
			await waitFor(() => z21.rx[0] ?? undefined, {
				label: 'z21 rx TRACK_POWER ON  set',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));

			// erwartetes Frame aus deinem Serverlog:
			expect(hex).toContain('070040002181a0');

			await z21.close();
			await stopCtx(ctx);
		});

		it('sends LOCO_ESTOP to Z21 when UI sends loco.command.eStop on', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// WS command wie bei dir im Log:
			ctx.ws.send(JSON.stringify({ type: 'loco.command.eStop', addr: 1845 }));

			// warte bis UDP rausgeht
			await waitFor(() => z21.rx[0] ?? undefined, {
				label: 'z21 rx LOCO_ESTOP  set',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));

			// erwartetes Frame aus deinem Serverlog:
			expect(hex).toContain('0800400092c73560');

			await z21.close();
			await stopCtx(ctx);
		});

		it('sends LOCO_FUNCTION to Z21 when UI sends loco.command.function.set', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// WS command wie bei dir im Log:
			ctx.ws.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 7, on: true }));

			// warte bis UDP rausgeht
			await waitFor(() => z21.rx[0] ?? undefined, {
				label: 'z21 rx LOCO_FUNCTION  set',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));

			// erwartetes Frame aus deinem Serverlog:
			expect(hex).toContain('0a004000e4f8c73547a9');

			await z21.close();
			await stopCtx(ctx);
		});
	});
});
