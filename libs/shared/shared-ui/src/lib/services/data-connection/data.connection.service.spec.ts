/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import { APP_ENVIRONMENT } from '../../config/app-environment';

import { DataConnectionService } from './data.connection.service';

describe('DataConnectionService', () => {
	let httpClient: HttpClient;
	let service: DataConnectionService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [
				DataConnectionService,
				{ provide: HttpClient, useValue: { get: vi.fn(), post: vi.fn() } },
				{
					provide: APP_ENVIRONMENT,
					useValue: {
						production: false,
						baseUrl: 'http://localhost'
					}
				}
			]
		});
		httpClient = TestBed.inject(HttpClient);
		service = TestBed.inject(DataConnectionService);
	});

	it('should request data from the configured API', () => {
		const getSpy = vi.spyOn(httpClient, 'get').mockReturnValue(of({}));

		service.getData();

		expect(getSpy).toHaveBeenCalledWith('http://localhost/php-api/api.php', {
			params: {
				action: 'getData'
			}
		});
	});

	it('should send the list and current date to the API', () => {
		const postSpy = vi.spyOn(httpClient, 'post').mockReturnValue(of({}));

		service.addData('test list');

		const [url, body, options] = postSpy.mock.calls[0];

		expect(url).toBe('http://localhost/php-api/api.php');
		expect(body.get('action')).toBe('addData');
		expect(body.get('list')).toBe('test list');
		expect(body.get('date')).toEqual(expect.any(String));
		expect(options).toEqual({
			withCredentials: true
		});
	});

	it('should request deletion of the given entry', () => {
		const postSpy = vi.spyOn(httpClient, 'post').mockReturnValue(of({}));

		service.deleteData(42);

		expect(postSpy).toHaveBeenCalledOnce();

		const [url, body, options] = postSpy.mock.calls[0];

		expect(url).toBe('http://localhost/php-api/api.php');
		expect(body).toBeInstanceOf(FormData);
		expect(body.get('action')).toBe('deleteData');
		expect(body.get('id')).toBe('42');
		expect(options).toEqual({
			withCredentials: true
		});
	});

	it('should send the user data to the user API', () => {
		const postSpy = vi.spyOn(httpClient, 'post').mockReturnValue(of({}));

		service.addUser({
			user: 'testUser',
			password: 'testPassword',
			email: 'test@example.com'
		});

		const [url, body, options] = postSpy.mock.calls[0];

		expect(url).toBe('http://localhost/php-api/encryption.php');
		expect(body.get('action')).toBe('addUser');
		expect(body.get('username')).toBe('testUser');
		expect(body.get('password')).toBe('testPassword');
		expect(body.get('email')).toBe('test@example.com');
		expect(options).toEqual({
			withCredentials: true
		});
	});

	it('should send the login credentials to the login API', () => {
		const postSpy = vi.spyOn(httpClient, 'post').mockReturnValue(of({}));

		service.login({
			email: 'test@example.com',
			password: 'testPassword'
		});

		const [url, body, options] = postSpy.mock.calls[0];

		expect(url).toBe('http://localhost/php-api/login.php');
		expect(body.get('action')).toBe('login');
		expect(body.get('email')).toBe('test@example.com');
		expect(body.get('password')).toBe('testPassword');
		expect(options).toEqual({
			withCredentials: true
		});
	});
});
