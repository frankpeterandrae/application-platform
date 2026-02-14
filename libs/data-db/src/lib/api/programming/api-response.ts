/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type ApiSuccessResponse<T> = {
	ok: true;
	data: T;
};

export type ApiErrorResponse = {
	ok: false;
	error: {
		message: string;
	};
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 *
 */
export function ok<T>(data: T): ApiSuccessResponse<T> {
	return {
		ok: true,
		data
	};
}

/**
 *
 */
export function fail(message: string): ApiErrorResponse {
	return {
		ok: false,
		error: {
			message
		}
	};
}
