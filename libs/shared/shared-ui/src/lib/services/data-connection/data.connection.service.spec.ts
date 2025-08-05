/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { DataConnectionService } from './data.connection.service';
import { setupTestingModule } from '../../../test-setup';

/**
 * Test suite for DataConnectionService.
 */
describe('DataConnectionService', () => {
	let httpClient: HttpClient;
	let service: DataConnectionService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [DataConnectionService, { provide: HttpClient, useValue: { get: jest.fn(), post: jest.fn() } }]
		});
		httpClient = TestBed.inject(HttpClient);
		service = TestBed.inject(DataConnectionService);
	});

	it('should fetch data from the server', () => {
		const mockResponse = { data: 'test data' };
		jest.spyOn(httpClient, 'get').mockReturnValue(of(mockResponse));
		service.getData().subscribe((response) => {
			expect(response).toEqual(mockResponse);
		});
	});

	it('should add data to the server', () => {
		const mockResponse = { success: true };
		jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse));
		service.addData('test list').subscribe((response) => {
			expect(response).toEqual(mockResponse);
		});
	});

	it('should delete data from the server', () => {
		const mockResponse = { success: true };
		jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse));
		service.deleteData(1).subscribe((response) => {
			expect(response).toEqual(mockResponse);
		});
	});

	it('should add a new user to the server', () => {
		const mockResponse = { success: true };
		jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse));
		service.addUser({ user: 'testUser', password: 'testPassword', email: 'test@example.com' }).subscribe((response) => {
			expect(response).toEqual(mockResponse);
		});
	});

	it('should log in a user', () => {
		const mockResponse = { success: true };
		jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse));
		service.login({ email: 'test@example.com', password: 'testPassword' }).subscribe((response) => {
			expect(response).toEqual(mockResponse);
		});
	});
});
