import { type POM_Options } from './pom-options';
import { type XBusCmd } from './x-bus-cmd';
import { type XBusHeader } from './x-bus-header';
import { type Z21LanHeader } from './z21-lan-header';

/**
 * LAN_X command structure.
 * All LAN_X commands consist of three components:
 * - LAN_X header (always 0x0040)
 * - XBusHeader (identifies the command category)
 * - XBusCmd or other sub-command (identifies the specific operation)
 */
export interface LanXCommand {
	/** The LAN header (always LAN_X = 0x0040) */
	readonly lanHeader: Z21LanHeader.LAN_X;
	/** The X-Bus header byte */
	readonly xBusHeader: XBusHeader;
	/** The X-Bus command/sub-command byte */
	readonly xBusCmd?: XBusCmd;
	/** Optional POM option for CV/POM commands */
	readonly option?: POM_Options;
}
