/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Broadcastflags = {
	none?: boolean;
	basic?: boolean;
	rMbus?: boolean;
	railcom?: boolean;
	systemState?: boolean;
	changedLocoInfo?: boolean;
	locoNetWithoutLocoAndSwitches?: boolean;
	locoNetWithLocoAndSwitches?: boolean;
	locoNetDetector?: boolean;
	railcomDatachanged?: boolean;
};
