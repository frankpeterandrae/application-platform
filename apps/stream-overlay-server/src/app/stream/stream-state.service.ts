/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { StreamState } from '@application-platform/interfaces';
import { Injectable } from '@nestjs/common';

/**
 * Stores the transient state of the current stream.
 */
@Injectable()
export class StreamStateService {
	private state: StreamState = {
		title: undefined,
		subtitle: undefined
	};

	/**
	 * Returns the current stream state.
	 *
	 * @returns The current stream state.
	 */
	public getState(): StreamState {
		return this.state;
	}

	/**
	 * Updates parts of the current stream state.
	 *
	 * @param state The state changes to apply.
	 */
	public updateState(state: Partial<StreamState>): void {
		this.state = {
			...this.state,
			...state
		};
	}
}
