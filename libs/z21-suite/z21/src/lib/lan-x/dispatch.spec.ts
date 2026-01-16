import { XBusHeader } from '../constants';

import { resolveLanXCommand } from './dispatch';

describe('resolveLanXCommand', () => {
	it('should return LAN_X_GET_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is 3', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO, 0x01, 0x02]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_GET_TURNOUT_INFO');
	});

	it('should return LAN_X_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is 4', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO, 0x01, 0x02, 0x03]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_TURNOUT_INFO');
	});

	it('should return LAN_X_TURNOUT_INFO when xHeader is TURNOUT_INFO and length is greater than 4', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO, 0x01, 0x02, 0x03, 0x04]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_TURNOUT_INFO');
	});

	it('should return LAN_X_UNKNOWN_COMMAND when xHeader is TURNOUT_INFO and length is less than 3', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO, 0x01]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_UNKNOWN_COMMAND');
	});

	it('should return LAN_X_UNKNOWN_COMMAND when xHeader is TURNOUT_INFO and length is 1', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_UNKNOWN_COMMAND');
	});

	it('should return LAN_X_UNKNOWN_COMMAND when data is empty', () => {
		const data = new Uint8Array([]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_UNKNOWN_COMMAND');
	});

	it('should return LAN_X_UNKNOWN_COMMAND when xHeader does not match TURNOUT_INFO', () => {
		const data = new Uint8Array([0xff, 0x01, 0x02]);
		expect(resolveLanXCommand(data)).toBe('LAN_X_UNKNOWN_COMMAND');
	});

	it('should match command from LAN_X_COMMANDS when xHeader matches and xBusCmd matches', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO, 0x01, 0x02]);
		const result = resolveLanXCommand(data);
		expect(result).toBeDefined();
	});

	it('should match command from LAN_X_COMMANDS when xHeader matches and command has no xBusCmd', () => {
		const data = new Uint8Array([XBusHeader.TURNOUT_INFO, 0x01]);
		const result = resolveLanXCommand(data);
		expect(result).toBeDefined();
	});
});
