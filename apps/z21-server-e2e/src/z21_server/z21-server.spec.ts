/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TurnoutState } from '@application-platform/z21-shared';
import { describe, expect, it } from 'vitest';

import {
	connectWs,
	delay,
	sendUdpHex,
	startFakeZ21,
	startServer,
	startServerAndConnectWs,
	stopCtx,
	waitFor,
	waitForWsType
} from '../support/e2e-helpers';

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
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.drive', addr: 1845, speed: 47, dir: 'FWD', steps: 128 }));

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
			ctx.ws?.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 12, state: TurnoutState.STRAIGHT, pulseMs: 200 }));

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
			ctx.ws?.send(JSON.stringify({ type: 'system.command.trackpower.set', on: true }));

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
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.eStop', addr: 1845 }));

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
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 7, on: true }));

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
	describe('session lifecycle', () => {
		it('activates Z21 session on first WS client (broadcastflags + systemstate)', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			// Before first WS client connects, session must be inactive => no UDP traffic
			await delay(200);
			expect(z21.rx.length).toBe(0);

			const ws = await connectWs(base.httpPort);

			await waitFor(() => (z21.rx.length >= 2 ? z21.rx.length : undefined), {
				label: 'z21 rx activate',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex).toContain('0800500001000000'); // LAN_SET_BROADCASTFLAGS (Basic)
			expect(hex).toContain('04008500'); // LAN_SYSTEM_STATE_DATAGET

			await stopCtx({ ...base, ws: ws.ws });
			await z21.close();
		}, 20000);

		it('deactivates Z21 session on last WS client (LAN_LOGOFF)', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			const ws = await connectWs(base.httpPort);

			// ensure activation traffic happened, then ignore it for this test
			await waitFor(() => (z21.rx.length >= 1 ? z21.rx.length : undefined), { label: 'z21 rx pre', timeoutMs: 2000 });
			z21.rx.splice(0);

			// Closing the last client should trigger LAN_LOGOFF
			ws.ws.close();

			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04003000'), {
				label: 'z21 rx logoff',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			await stopCtx({ ...base, ws: ws.ws });
			await z21.close();
		}, 20000);

		it('kicks a zombie WS client via ping/pong and deactivates Z21 session (LAN_LOGOFF)', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			const ws1 = await connectWs(base.httpPort);

			// Activation traffic abwarten und dann ignorieren
			await waitFor(() => (z21.rx.length >= 1 ? z21.rx.length : undefined), { label: 'z21 rx pre', timeoutMs: 2000 });
			z21.rx.splice(0);

			// "Zombie": Socket halb-offen simulieren, indem wir keine pongs liefern können.
			// Praktisch: wir beenden einfach den underlying TCP socket ohne Close-Handshake.
			// ws (node 'ws') exposes _socket; das ist intern, aber für e2e ok.

			const raw: any = ws1.ws as any;
			raw._socket?.destroy();

			// Jetzt muss der server per heartbeat feststellen: kein pong => terminate => disconnect => LAN_LOGOFF
			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04003000'), {
				label: 'z21 rx logoff after zombie kick',
				timeoutMs: 3000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			await stopCtx({ ...base, ws: ws1.ws });
			await z21.close();
		}, 20000);

		it('does not deactivate Z21 session while at least one WS client is still connected (no LAN_LOGOFF)', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			const ws1 = await connectWs(base.httpPort);

			// Activation traffic abwarten, dann ignorieren (wir testen nur "kein logoff")
			await waitFor(() => (z21.rx.length >= 2 ? z21.rx.length : undefined), {
				label: 'z21 rx activate (2 frames)',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});
			z21.rx.splice(0);

			const ws2 = await connectWs(base.httpPort);

			// Ein Client geht weg, aber Session muss aktiv bleiben
			ws1.ws.close();

			// kurz warten: wenn dein Code fälschlich logoff schickt, taucht es jetzt auf
			await delay(500);

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex).not.toContain('04003000'); // LAN_LOGOFF

			// Cleanup: jetzt erst der letzte Client -> dann MUSS logoff kommen
			ws2.ws.close();

			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04003000'), {
				label: 'z21 rx logoff on last disconnect',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			await stopCtx({ ...base, ws: ws2.ws });
			await z21.close();
		}, 20000);

		it('re-activates Z21 session after reconnect (activate -> logoff -> activate)', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			// 1) first connect => activation
			const ws1 = await connectWs(base.httpPort);

			await waitFor(() => (z21.rx.length >= 2 ? z21.rx.length : undefined), {
				label: 'z21 rx activate #1',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex1 = z21.rx.map((b) => b.toString('hex'));
			expect(hex1).toContain('0800500001000000'); // LAN_SET_BROADCASTFLAGS
			expect(hex1).toContain('04008500'); // LAN_SYSTEM_STATE_DATAGET

			// 2) disconnect => logoff
			z21.rx.splice(0);
			ws1.ws.close();

			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04003000'), {
				label: 'z21 rx logoff',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			// 3) second connect => activation again
			z21.rx.splice(0);
			const ws2 = await connectWs(base.httpPort);

			await waitFor(() => (z21.rx.length >= 2 ? z21.rx.length : undefined), {
				label: 'z21 rx activate #2',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex2 = z21.rx.map((b) => b.toString('hex'));
			expect(hex2).toContain('0800500001000000'); // LAN_SET_BROADCASTFLAGS
			expect(hex2).toContain('04008500'); // LAN_SYSTEM_STATE_DATAGET

			await stopCtx({ ...base, ws: ws2.ws });
			await z21.close();
		}, 20000);
	});

	describe('getversion', () => {
		it('requests GET_VERSION on session activation and caches result for new clients', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			// 1) first WS client connects -> should trigger GET_VERSION
			const ws1 = await connectWs(base.httpPort);

			const GET_VERSION_REQ = '07004000212100'; // LEN=7, LAN_X, [0x21,0x21,XOR=0x00]

			await waitFor(() => z21.rx.find((b) => b.toString('hex') === GET_VERSION_REQ), {
				label: 'z21 rx GET_VERSION request',
				timeoutMs: 3000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const countGetVersion = (): number => z21.rx.filter((b) => b.toString('hex') === GET_VERSION_REQ).length;

			// Send a fake Z21 response
			const major = 2;
			const minor = 1;
			const xor = (0x63 ^ 0x21 ^ major ^ minor) & 0xff;
			const ANSWER = Buffer.from([0x09, 0x00, 0x40, 0x00, 0x63, 0x21, major, minor, xor]).toString('hex');
			await sendUdpHex(ANSWER);

			// Verify first client got version
			const versionMsg1 = await waitFor(() => ws1.messages.find((m) => m?.type === 'system.message.z21.version'), {
				label: 'ws1 system.message.z21.version',
				timeoutMs: 3000,
				dump: () => `\nWS1:\n${ws1.messages.map((m) => JSON.stringify(m)).join('\n')}`
			});

			expect(versionMsg1).toBeDefined();
			expect(versionMsg1.version).toMatch(/^V\d+\.\d+$/);

			// Record initial GET_VERSION count
			const initialCount = countGetVersion();
			expect(initialCount).toBe(1);

			// 2) second WS client connects quickly
			const ws2 = await connectWs(base.httpPort);

			// Give a bit of time for any pending version broadcasts
			await delay(300);

			// 3) Verify no second GET_VERSION was triggered by second client
			const finalCount = countGetVersion();
			expect(finalCount).toBe(initialCount); // Still only 1, no second request

			await stopCtx({ ...base, ws: ws2.ws });
			await z21.close();
		}, 25000);
	});
});
