export interface Poi {
	id: string;
	name: string;
	type: string;
	distance: string;
	distanceM?: number;
	coordinates: [number, number];
	lines?: string[];
}
