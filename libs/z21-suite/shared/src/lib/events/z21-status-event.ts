/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Z21StatusEvent = {
	type: 'event.z21.status';
	payload: {
		powerOn?: boolean;
		emergencyStop?: boolean;
		shortCircuit?: boolean;
		programmingMode?: boolean;
	};
};
