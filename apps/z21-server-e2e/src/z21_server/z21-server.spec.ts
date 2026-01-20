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

	it('probes command station info (firmware -> hwinfo -> code) and broadcasts to WS', async () => {
		const base = await startServer();
		const z21 = await startFakeZ21(base.fakeZ21Port);

		const ws = await connectWs(base.httpPort);
		const ctx = { ...base, ws: ws.ws, messages: ws.messages };

		// 1) Server must request firmware version (LAN_X_GET_FIRMWARE_VERSION)
		await waitFor(() => z21.rx.find((b) => b.toString('hex') === '07004000f10afb'), {
			label: 'z21 rx firmware request',
			timeoutMs: 2000,
			dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
		});

		// send firmware reply = 1.23 (BCD): 0x09 0x00 0x40 0x00 0xf3 0x0a 0x01 0x23 0xdb
		await sendUdpHex('09004000f30a0123db'); // to server listen port (default in helper)

		// Expect WS broadcast with firmware version
		const fw = await waitForWsType<any>(ctx, 'system.message.firmware.version');
		expect(fw.major).toBe(1);
		expect(fw.minor).toBe(23);

		// 2) With FW >= 1.20, server should request LAN_GET_HWINFO
		await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04001a00'), {
			label: 'z21 rx hwinfo request',
			timeoutMs: 2000,
			dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
		});

		// send hwinfo reply: hwType = z21_START (0x00000204), fw = 1.23 (0x23 0x01 0x00 0x00)
		await sendUdpHex('0c001a000402000001230000');

		// Expect WS broadcast with hardware info
		const hw = await waitForWsType<any>(ctx, 'system.message.hardware.info');
		expect(hw.hardwareType).toBe('z21_START');

		// 3) For z21_START, server should request LAN_GET_CODE
		await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04001800'), {
			label: 'z21 rx code request',
			timeoutMs: 2000,
			dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
		});

		// send code reply: unlocked (0x02)
		await sendUdpHex('0500180002');

		const code = await waitForWsType<any>(ctx, 'system.message.z21.code');
		expect(code.code).toBe(2);

		await stopCtx({ ...base, ws: ws.ws });
		await z21.close();
	}, 20000);

	describe('multiple locomotives', () => {
		it('receives loco.message.state broadcasts for different locomotive addresses', async () => {
			const ctx = await startServerAndConnectWs();

			// Test with loco 1845 - use proven working frame
			await sendUdpHex('0f004000efc735048004000000009d');
			await delay(200);
			const loco1Messages = ctx.messages?.filter((m) => m.type === 'loco.message.state' && m['addr'] === 1845);
			expect(loco1Messages?.length).toBeGreaterThan(0);

			await stopCtx(ctx);
		}, 20000);

		it('handles simultaneous speed changes for multiple locomotives', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Send drive commands for two locos
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.drive', addr: 1845, speed: 47, dir: 'FWD', steps: 128 }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.drive', addr: 100, speed: 20, dir: 'REV', steps: 128 }));

			await waitFor(() => (z21.rx.length >= 2 ? z21.rx : undefined), {
				label: 'z21 rx multiple locos',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			expect(z21.rx.length).toBeGreaterThanOrEqual(2);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});

	describe('function toggles', () => {
		it('handles rapid function toggles without loss', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Toggle F0, F1, F2 rapidly
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 0, on: true }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 1, on: true }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 2, on: true }));

			await waitFor(() => (z21.rx.length >= 3 ? z21.rx : undefined), {
				label: 'z21 rx function toggles',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			expect(z21.rx.length).toBeGreaterThanOrEqual(3);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('verifies multiple functions can be toggled for same locomotive', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Set F3, F7, F15
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 3, on: true }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 7, on: true }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.function.set', addr: 1845, fn: 15, on: true }));

			await waitFor(() => (z21.rx.length >= 3 ? z21.rx : undefined), {
				label: 'z21 rx multiple function numbers',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			expect(z21.rx.length).toBeGreaterThanOrEqual(3);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});

	describe('turnout operations', () => {
		it('handles multiple turnout commands in sequence', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Set multiple turnouts
			ctx.ws?.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 1, state: 'STRAIGHT', pulseMs: 100 }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 2, state: 'DIVERGING', pulseMs: 100 }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 3, state: 'STRAIGHT', pulseMs: 100 }));

			await waitFor(() => (z21.rx.length >= 3 ? z21.rx : undefined), {
				label: 'z21 rx multiple turnouts',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			expect(z21.rx.length).toBeGreaterThanOrEqual(3);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('sends turnout commands with different ports (STRAIGHT vs DIVERGING)', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Same turnout, different directions
			ctx.ws?.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 10, state: 'STRAIGHT', pulseMs: 100 }));
			await delay(50);
			ctx.ws?.send(JSON.stringify({ type: 'switching.command.turnout.set', addr: 10, state: 'DIVERGING', pulseMs: 100 }));

			await waitFor(() => (z21.rx.length >= 2 ? z21.rx : undefined), {
				label: 'z21 rx turnout both directions',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex.length).toBeGreaterThanOrEqual(2);
			// Frames should be different (different port bits)
			expect(hex[0]).not.toBe(hex[1]);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});

	describe('emergency scenarios', () => {
		it('receives emergency stop broadcast from Z21', async () => {
			const ctx = await startServerAndConnectWs();

			// LAN_X_BC_STOPPED frame
			await sendUdpHex('07004000810081');

			const stopped = await waitForWsType<any>(ctx, 'system.message.stop', 5000);
			expect(stopped).toBeDefined();

			await stopCtx(ctx);
		}, 20000);

		it('sends LOCO_ESTOP when UI sends loco.eStop', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			ctx.ws?.send(JSON.stringify({ type: 'loco.command.eStop', addr: 1845 }));

			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '0800400092c73560'), {
				label: 'z21 rx loco estop',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex).toContain('0800400092c73560'); // LAN_X_SET_LOCO_E_STOP

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});

	describe('connection resilience', () => {
		it('handles WebSocket reconnection gracefully', async () => {
			const base = await startServer();
			const z21 = await startFakeZ21(base.fakeZ21Port);

			// First connection
			const ws1 = await connectWs(base.httpPort);
			await waitFor(() => (z21.rx.length >= 1 ? z21.rx : undefined), {
				label: 'z21 rx activate',
				timeoutMs: 2000
			});

			z21.rx.splice(0);
			ws1.ws.close();

			// Wait for logoff
			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '04003000'), {
				label: 'z21 rx logoff',
				timeoutMs: 2000
			});

			z21.rx.splice(0);

			// Reconnect
			const ws2 = await connectWs(base.httpPort);
			await waitFor(() => (z21.rx.length >= 1 ? z21.rx : undefined), {
				label: 'z21 rx re-activate',
				timeoutMs: 2000
			});

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex).toContain('0800500001000000'); // Re-activation successful

			await stopCtx({ ...base, ws: ws2.ws });
			await z21.close();
		}, 20000);

		it('handles invalid JSON messages gracefully without crashing', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Send invalid JSON (server will log errors but not crash)
			ctx.ws?.send('{ invalid json }');
			ctx.ws?.send('not json at all');

			// Wait a bit
			await delay(300);

			// Server should still be responsive - send valid command
			ctx.ws?.send(JSON.stringify({ type: 'system.command.trackpower.set', on: true }));

			// Wait for the valid command to be processed
			await waitFor(() => (z21.rx.length >= 1 ? z21.rx : undefined), {
				label: 'z21 rx after invalid json',
				timeoutMs: 2000
			});

			// WebSocket should still be open
			expect(ctx.ws?.readyState).toBe(1); // OPEN

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});

	describe('address range validation', () => {
		it('handles short and long locomotive addresses', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Short address (< 100)
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.drive', addr: 3, speed: 10, dir: 'FWD', steps: 128 }));
			await delay(100);

			// Long address (>= 100)
			ctx.ws?.send(JSON.stringify({ type: 'loco.command.drive', addr: 1845, speed: 10, dir: 'FWD', steps: 128 }));

			await waitFor(() => (z21.rx.length >= 2 ? z21.rx : undefined), {
				label: 'z21 rx both addresses',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			expect(z21.rx.length).toBeGreaterThanOrEqual(2);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});

	describe('CV programming', () => {
		it('sends LAN_X_CV_READ to Z21 when UI requests CV read', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV read request for CV29
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 29, requestId: 'req-1' } }));

			// Wait for LAN_X_CV_READ command to be sent to Z21
			// Format: 09 00 40 00 23 11 00 1c <XOR>
			// 23 = CV_READ header, 11 = READ sub-command, 00 1c = CV29 address (MSB-first)
			await waitFor(() => z21.rx.find((b) => b.toString('hex').startsWith('09004000231')), {
				label: 'z21 rx CV_READ CV29',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex.some((h) => h.startsWith('090040002311') && h.includes('001c'))).toBe(true);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('broadcasts cv.result when Z21 sends LAN_X_CV_RESULT', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV read request
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 29, requestId: 'req-2' } }));

			// Wait for read command with sub-command 0x11 and MSB-first address (00 1c)
			await waitFor(() => z21.rx.find((b) => b.toString('hex').startsWith('09004000231100')), {
				label: 'z21 rx CV_READ',
				timeoutMs: 2000
			});

			// Z21 responds with CV result: CV29 = 42
			// Format: 0a 00 40 00 64 14 00 1c 2a <XOR>
			// 64 = CV_RESULT, 14 = sub-command, 00 1c = CV29 (MSB-first), 2a = 42
			// XOR: 0x64 ^ 0x14 ^ 0x00 ^ 0x1c ^ 0x2a = 0x5a
			// Send to server's listen port (default 21105)
			await sendUdpHex('0a0040006414001c2a5a');

			// Wait for WS broadcast with CV result
			const cvResult = await waitForWsType<any>(ctx, 'programming.replay.cv.result', 4000);
			expect(cvResult.payload.cvAdress).toBe(29);
			expect(cvResult.payload.cvValue).toBe(42);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('sends LAN_X_CV_WRITE to Z21 when UI requests CV write', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV write request: set CV29 to 14
			ctx.ws.send(
				JSON.stringify({ type: 'programming.command.cv.write', payload: { cvAdress: 29, cvValue: 14, requestId: 'req-3' } })
			);

			// Wait for LAN_X_CV_WRITE command to be sent to Z21
			// Format: 0a 00 40 00 24 12 00 1c 0e <XOR>
			// 24 = CV_WRITE header, 12 = WRITE sub-command, 00 1c = CV29 (MSB-first), 0e = value 14
			await waitFor(() => z21.rx.find((b) => b.toString('hex').startsWith('0a004000241200')), {
				label: 'z21 rx CV_WRITE CV29=14',
				timeoutMs: 2000,
				dump: () => `\nRX:\n${z21.rx.map((b) => b.toString('hex')).join('\n')}`
			});

			const hex = z21.rx.map((b) => b.toString('hex'));
			expect(hex.some((h) => h.startsWith('0a004000241200'))).toBe(true);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('broadcasts cv.result after successful CV write', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV write request
			ctx.ws.send(
				JSON.stringify({ type: 'programming.command.cv.write', payload: { cvAdress: 29, cvValue: 14, requestId: 'req-4' } })
			);

			// Wait for write command with MSB-first address (00 1c)
			await waitFor(() => z21.rx.find((b) => b.toString('hex').startsWith('0a004000241200')), {
				label: 'z21 rx CV_WRITE',
				timeoutMs: 2000
			});

			// Z21 responds with CV result confirming the write
			// Format: 0a 00 40 00 64 14 00 1c 0e <XOR>
			// XOR: 0x64 ^ 0x14 ^ 0x00 ^ 0x1c ^ 0x0e = 0x62
			await sendUdpHex('0a0040006414001c0e62');

			// Wait for WS broadcast with CV result
			const cvResult = await waitForWsType<any>(ctx, 'programming.replay.cv.result', 4000);
			expect(cvResult.payload.cvAdress).toBe(29);
			expect(cvResult.payload.cvValue).toBe(14);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('broadcasts cv.nack when Z21 sends LAN_X_CV_NACK', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV read request
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 29, requestId: 'req-5' } }));

			// Wait for read command
			await waitFor(() => z21.rx.find((b) => b.toString('hex').startsWith('090040002311')), {
				label: 'z21 rx CV_READ',
				timeoutMs: 2000
			});

			// Z21 responds with CV NACK (no acknowledge)
			await sendUdpHex('07004000611312');

			// Wait for WS broadcast with CV NACK
			const cvNack = await waitForWsType<any>(ctx, 'programming.replay.cv.nack', 4000);
			expect(cvNack.payload.error).toBeDefined();
			expect(cvNack.payload.error).toContain('NACK');

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('broadcasts cv.nack with short circuit flag when Z21 sends LAN_X_CV_NACK_SC', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV read request
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 1, requestId: 'req-6' } }));

			// Wait for read command (CV1 = address 0x0000)
			await waitFor(() => z21.rx.length >= 1, {
				label: 'z21 rx CV_READ',
				timeoutMs: 2000
			});

			// Z21 responds with CV NACK Short Circuit
			await sendUdpHex('07004000611212');

			// Wait for WS broadcast with CV NACK Short Circuit
			const cvNack = await waitForWsType<any>(ctx, 'programming.replay.cv.nack', 4000);
			expect(cvNack.payload.error).toBeDefined();
			expect(cvNack.payload.error).toContain('short circuit');

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('handles multiple sequential CV read operations', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// Read CV1 and respond
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 1, requestId: 'req-7' } }));
			await waitFor(() => z21.rx.length >= 1, { label: 'cv1 read', timeoutMs: 2000 });
			// CV1 = 1: 64 14 00 00 01 => XOR = 0x71
			await sendUdpHex('0a004000641400000171');
			await delay(100);

			// Read CV17 and respond
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 17, requestId: 'req-8' } }));
			await waitFor(() => z21.rx.length >= 2, { label: 'cv17 read', timeoutMs: 2000 });
			// CV17 = 17: 64 14 00 10 11 => XOR = 0x75
			await sendUdpHex('0a004000641400101175');
			await delay(100);

			// Read CV29 and respond
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 29, requestId: 'req-9' } }));
			await waitFor(() => z21.rx.length >= 3, { label: 'cv29 read', timeoutMs: 2000 });

			const cvReads = z21.rx.filter((b) => b.toString('hex').startsWith('090040002311'));
			expect(cvReads.length).toBeGreaterThanOrEqual(3);

			await z21.close();
			await stopCtx(ctx);
		}, 20000);

		it('handles CV read timeout gracefully', async () => {
			const ctx = await startServerAndConnectWs();
			const z21 = await startFakeZ21(ctx.fakeZ21Port);

			// UI sends CV read request
			ctx.ws.send(JSON.stringify({ type: 'programming.command.cv.read', payload: { cvAdress: 29, requestId: 'req-10' } }));

			// Wait for read command
			await waitFor(() => z21.rx.length >= 1, {
				label: 'z21 rx CV_READ',
				timeoutMs: 2000
			});

			// Don't send a response - let it timeout
			// The CV programming service should handle this gracefully

			// Wait a bit to ensure no crash
			await delay(1500);

			// Server should still be responsive
			ctx.ws.send(JSON.stringify({ type: 'system.command.trackpower.set', on: true }));

			await waitFor(() => z21.rx.find((b) => b.toString('hex') === '070040002181a0'), {
				label: 'z21 rx track power after timeout',
				timeoutMs: 2000
			});

			// WebSocket should still be open
			expect(ctx.ws.readyState).toBe(1); // OPEN

			await z21.close();
			await stopCtx(ctx);
		}, 20000);
	});
});
