/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expect, test, type WebSocketRoute } from '@playwright/test';

const widgets = [
	{
		path: 'header',
		selector: 'stream-overlay-header',
		width: 640,
		height: 128,
		request: 'stream.get-state',
		response: { event: 'stream.state-changed', data: { title: 'Miniature painting', subtitle: 'Sky Lantern' } },
		content: [
			{ selector: 'h1', text: 'Live: Miniature painting' },
			{ selector: 'h2', text: 'Sky Lantern' }
		],
		update: { event: 'stream.state-changed', data: { title: 'Painting again' } },
		updatedContent: [{ selector: 'h1', text: 'Live: Painting again' }]
	},
	{
		path: 'current-paint',
		selector: 'stream-overlay-current-paint',
		width: 480,
		height: 144,
		request: 'paint.get-current',
		response: {
			event: 'paint.changed',
			data: { id: 'citadel:21-03', brand: 'citadel', sku: '21-03', name: 'Mephiston Red', mainColor: '#991115', colorGroups: ['red'] }
		},
		content: [{ selector: 'strong', text: 'Mephiston Red' }],
		update: { event: 'paint.changed' },
		removedContent: ['strong']
	},
	{ path: 'webcam-frame', selector: 'stream-overlay-camera', width: 320, height: 240 },
	{ path: 'scene-frame', selector: 'stream-overlay-scene-frame', width: 1920, height: 1080 }
];

for (const widget of widgets) {
	test(`renders only the ${widget.path} widget`, async ({ page }) => {
		const requests: string[] = [];
		const connections: WebSocketRoute[] = [];
		await page.routeWebSocket('ws://localhost:3000/ws', (socket) => {
			connections.push(socket);
			socket.onMessage((message) => {
				const { event } = JSON.parse(String(message)) as { event: string };
				requests.push(event);

				if (event === widget.request && widget.response) {
					socket.send(JSON.stringify(widget.response));
				}
			});
		});

		await page.setViewportSize({ width: widget.width, height: widget.height });
		await page.goto(`/overlay/${widget.path}`);
		const source = page.locator(widget.selector);
		await expect(source).toBeVisible();
		await expect(page.locator('stream-overlay-root > :not(router-outlet)')).toHaveCount(1);
		await expect(page.locator('html')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
		await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

		for (const { selector, text } of widget.content ?? []) {
			await expect(source.locator(selector)).toHaveText(text);
		}
		expect(requests).toEqual(widget.request ? [widget.request] : []);
		expect(connections).toHaveLength(widget.request ? 1 : 0);

		for (const { width, height } of [widget, { width: 240, height: 112 }]) {
			await page.setViewportSize({ width, height });
			expect(await source.boundingBox()).toMatchObject({ x: 0, y: 0 });
			expect(
				await page.evaluate(() => ({
					width: document.documentElement.scrollWidth,
					height: document.documentElement.scrollHeight
				}))
			).toEqual({ width, height });
		}

		connections[0]?.send(JSON.stringify(widget.update));
		for (const { selector, text } of widget.updatedContent ?? []) {
			await expect(source.locator(selector)).toHaveText(text);
		}
		for (const selector of widget.removedContent ?? []) {
			await expect(source.locator(selector)).toHaveCount(0);
		}
	});
}
