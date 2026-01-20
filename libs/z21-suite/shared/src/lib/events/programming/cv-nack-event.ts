export type CvNackEvent = {
	type: 'event.cv.nack';
	payload: {
		shortCircuit: boolean;
	};
};
