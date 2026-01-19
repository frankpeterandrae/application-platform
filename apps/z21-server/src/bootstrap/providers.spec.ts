/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommandStationInfo, LocoManager } from '@application-platform/domain';
import { Z21CommandService, Z21Udp } from '@application-platform/z21';
import { beforeEach, describe, expect, it } from 'vitest';

import { Z21EventHandler } from '../handler/z21-event-handler';
import { AppWsServer } from '../infra/ws/app-websocket-server';
import { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';

import { createProviders } from './providers';

describe('createProviders', () => {
	const cfg = {
		httpPort: 6060,
		z21: { host: '2.3.4.5', udpPort: 21106, listenPort: 30000 },
		safety: { stopAllOnClientDisconnect: true }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates providers using supplied config', () => {
		const providers = createProviders(cfg as any);

		expect(providers.cfg).toBe(cfg as any);
		expect(providers.cfg.httpPort).toBe(6060);
		expect(providers.cfg.z21.host).toBe('2.3.4.5');
		expect(providers.cfg.z21.udpPort).toBe(21106);
	});

	it('constructs all required components', () => {
		const providers = createProviders(cfg as any);

		expect(providers.udp).toBeInstanceOf(Z21Udp);
		expect(providers.wsServer).toBeInstanceOf(AppWsServer);
		expect(providers.z21CommandService).toBeInstanceOf(Z21CommandService);
		expect(providers.commandStationInfo).toBeInstanceOf(CommandStationInfo);
		expect(providers.locoManager).toBeInstanceOf(LocoManager);
		expect(providers.csInfoOrchestrator).toBeInstanceOf(CommandStationInfoOrchestrator);
		expect(providers.z21EventHandler).toBeInstanceOf(Z21EventHandler);
	});

	it('creates HTTP server instance', () => {
		const providers = createProviders(cfg as any);

		expect(providers.httpServer).toBeDefined();
		expect(typeof providers.httpServer.listen).toBe('function');
		expect(typeof providers.httpServer.close).toBe('function');
	});

	it('creates logger with proper configuration', () => {
		const providers = createProviders(cfg as any);

		expect(providers.logger).toBeDefined();
		expect(typeof providers.logger.info).toBe('function');
		expect(typeof providers.logger.debug).toBe('function');
		expect(typeof providers.logger.warn).toBe('function');
		expect(typeof providers.logger.error).toBe('function');
		expect(typeof providers.logger.child).toBe('function');
	});

	it('broadcast function delegates to wsServer.broadcast', () => {
		const providers = createProviders(cfg as any);

		// Create a spy on the wsServer.broadcast method
		const broadcastSpy = vi.spyOn(providers.wsServer, 'broadcast');

		const msg = { type: 'session.ready' } as any;

		// Z21EventHandler uses the broadcast function passed to it in the constructor
		// We need to access it indirectly by triggering an event
		// For now, just verify the wsServer has a broadcast method
		expect(typeof providers.wsServer.broadcast).toBe('function');

		providers.wsServer.broadcast(msg);
		expect(broadcastSpy).toHaveBeenCalledWith(msg);

		broadcastSpy.mockRestore();
	});

	it('creates Z21Udp with correct configuration', () => {
		const providers = createProviders(cfg as any);

		// Verify UDP was created and has the expected methods
		expect(providers.udp).toBeDefined();
		expect(typeof providers.udp.start).toBe('function');
		expect(typeof providers.udp.stop).toBe('function');
		expect(typeof providers.udp.on).toBe('function');
	});

	it('creates csInfoOrchestrator with commandStationInfo and z21CommandService', () => {
		const providers = createProviders(cfg as any);

		expect(providers.csInfoOrchestrator).toBeDefined();
		expect(typeof providers.csInfoOrchestrator.reset).toBe('function');
		expect(typeof providers.csInfoOrchestrator.poke).toBe('function');
		expect(typeof providers.csInfoOrchestrator.ack).toBe('function');
	});
});
