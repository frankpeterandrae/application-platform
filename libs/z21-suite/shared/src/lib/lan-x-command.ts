/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type POM_Options } from './pom-options';
import { type XBusCmd } from './x-bus-cmd';
import { type XHeader } from './x-header';

/**
 * LAN_X command structure.
 * All LAN_X commands consist of three components:
 * - LAN_X header (always 0x0040)
 * - XHeader (identifies the command category)
 * - XBusCmd or other sub-command (identifies the specific operation)
 */
export interface LanXCommand {
	/** The X-Bus header byte */
	readonly xHeader: XHeader;
	/** The X-Bus command/sub-command byte */
	readonly xBusCmd?: XBusCmd;
	/** Optional POM option for CV/POM commands */
	readonly option?: POM_Options;
}
