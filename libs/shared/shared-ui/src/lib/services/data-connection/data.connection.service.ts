/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@angular-apps/config';

/**
 * Injectable service for data connection operations.
 */
@Injectable({
	providedIn: 'root'
})
export class DataConnectionService {
	private readonly http = inject(HttpClient);

	private readonly apiUrl = '/php-api/api.php'; // Use the environment-specific API URL
	private readonly addUserUrl = '/php-api/encryption.php'; // Use the environment-specific API URL
	private readonly loginUrl = '/php-api/login.php';

	/**
	 * Fetches data from the server.
	 * @returns {Observable<any>} An observable containing the server response.
	 */
	public getData(): Observable<any> {
		return this.http.get(`${environment.baseUrl}${this.apiUrl}`, { params: { action: 'getData' } });
	}

	/**
	 * Adds data to the server.
	 * @param {string} list - The data to be added.
	 * @returns {Observable<any>} An observable containing the server response.
	 */
	public addData(list: string): Observable<any> {
		const body = new FormData();
		body.append('action', 'addData');
		body.append('list', list);
		body.append('date', new Date().toISOString());

		return this.http.post(`${environment.baseUrl}${this.apiUrl}`, body, { withCredentials: true });
	}

	/**
	 * Deletes data from the server.
	 * @param {number} id - The ID of the data to be deleted.
	 * @returns {Observable<any>} An observable containing the server response.
	 */
	public deleteData(id: number): Observable<any> {
		const body = new FormData();
		body.append('action', 'deleteData');
		body.append('id', id.toString());

		return this.http.post(`${environment.baseUrl}${this.apiUrl}`, body, { withCredentials: true });
	}

	/**
	 * Adds a new user to the server.
	 * @param {object} userInfo - The user information.
	 * @param {string} userInfo.user - The username.
	 * @param {string} userInfo.password - The password.
	 * @param {string} userInfo.email - The email address.
	 * @returns {Observable<any>} An observable containing the server response.
	 */
	public addUser(userInfo: { user: string; password: string; email: string }): Observable<any> {
		const body = new FormData();
		body.append('action', 'addUser');
		body.append('username', userInfo.user);
		body.append('password', userInfo.password);
		body.append('email', userInfo.email);

		return this.http.post(`${environment.baseUrl}${this.addUserUrl}`, body, { withCredentials: true });
	}

	/**
	 * Logs in a user.
	 * @param {object} param - The login parameters.
	 * @param {string} param.password - The password.
	 * @param {string} param.email - The email address.
	 * @returns {Observable<any>} An observable containing the server response.
	 */
	public login(param: { password: string; email: string }): Observable<any> {
		const body = new FormData();
		body.append('action', 'login');
		body.append('email', param.email);
		body.append('password', param.password);

		return this.http.post(`${environment.baseUrl}${this.loginUrl}`, body, { withCredentials: true });
	}
}
