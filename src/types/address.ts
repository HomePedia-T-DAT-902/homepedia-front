export interface Address {
	label: string;
	coordinates: [lng: number, lat: number];
	citycode: string | null;
}

interface BanFeatureProperties {
	label: string;
	citycode?: string;
}

interface BanFeature {
	properties: BanFeatureProperties;
	geometry: { coordinates: [number, number] };
}

export interface BanFeatureCollection {
	features: BanFeature[];
}
