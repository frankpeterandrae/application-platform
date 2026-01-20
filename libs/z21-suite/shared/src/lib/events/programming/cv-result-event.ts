export type CvResultEvent = {
	type: 'event.cv.result';
	/** 1-based CV: CV1 => 1 */
	cv: number;
	/** 0..255 */
	value: number;
	raw: number[];
};
