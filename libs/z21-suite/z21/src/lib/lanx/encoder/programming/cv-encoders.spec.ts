import { encodeLanXCvRead } from './cv-read';
import { encodeLanXCvWrite } from './cv-write';

describe('CV Programming Encoders', () => {
	describe('encodeLanXCvRead', () => {
		it('encodes CV read command for CV1', () => {
			const buffer = encodeLanXCvRead(1);

			expect(buffer).toBeInstanceOf(Buffer);
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('encodes CV read command for CV29', () => {
			const buffer = encodeLanXCvRead(29);

			expect(buffer).toBeInstanceOf(Buffer);
		});

		it('encodes CV read command for high address (CV1024)', () => {
			const buffer = encodeLanXCvRead(1024);

			expect(buffer).toBeInstanceOf(Buffer);
		});
	});

	describe('encodeLanXCvWrite', () => {
		it('encodes CV write command for CV1 with value 3', () => {
			const buffer = encodeLanXCvWrite(1, 3);

			expect(buffer).toBeInstanceOf(Buffer);
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('encodes CV write command for CV29 with value 42', () => {
			const buffer = encodeLanXCvWrite(29, 42);

			expect(buffer).toBeInstanceOf(Buffer);
		});

		it('encodes CV write with minimum value (0)', () => {
			const buffer = encodeLanXCvWrite(1, 0);

			expect(buffer).toBeInstanceOf(Buffer);
		});

		it('encodes CV write with maximum value (255)', () => {
			const buffer = encodeLanXCvWrite(1, 255);

			expect(buffer).toBeInstanceOf(Buffer);
		});

		it('encodes CV write for high CV address', () => {
			const buffer = encodeLanXCvWrite(1024, 100);

			expect(buffer).toBeInstanceOf(Buffer);
		});
	});
});
