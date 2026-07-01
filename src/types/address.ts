export interface Address {
	label: string;
	coordinates: [lng: number, lat: number];
}

interface BanFeatureProperties {
	label: string;
}

interface BanFeature {
	properties: BanFeatureProperties;
	geometry: { coordinates: [number, number] };
}

export interface BanFeatureCollection {
	features: BanFeature[];
}
