import { decodeSystemState } from './decode-system-state';

describe('decodeSystemState', () => {
	it('decodes typical positive values into system state fields', () => {
		const state = Uint8Array.from([0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09]);

		expect(decodeSystemState(state)).toEqual({
			mainCurrent_mA: 1,
			progCurrent_mA: 2,
			filteredMainCurrent_mA: 3,
			temperature_C: 4,
			supplyVoltage_mV: 5,
			vccVoltage_mV: 6,
			centralState: 7,
			centralStateEx: 8,
			capabilities: 9
		});
	});

	it('decodes negative signed currents and temperatures', () => {
		const state = Uint8Array.from([0xff, 0xff, 0xfe, 0xff, 0xfd, 0xff, 0xfc, 0xff, 0x00, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0x00, 0xcc]);

		expect(decodeSystemState(state)).toEqual({
			mainCurrent_mA: -1,
			progCurrent_mA: -2,
			filteredMainCurrent_mA: -3,
			temperature_C: -4,
			supplyVoltage_mV: 0,
			vccVoltage_mV: 0,
			centralState: 0xaa,
			centralStateEx: 0xbb,
			capabilities: 0xcc
		});
	});

	it('decodes maximum unsigned values for voltages and flags', () => {
		const state = Uint8Array.from([0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0xff]);

		expect(decodeSystemState(state)).toEqual({
			mainCurrent_mA: 32767,
			progCurrent_mA: 32767,
			filteredMainCurrent_mA: 32767,
			temperature_C: 32767,
			supplyVoltage_mV: 65535,
			vccVoltage_mV: 65535,
			centralState: 0xff,
			centralStateEx: 0xff,
			capabilities: 0xff
		});
	});
});
