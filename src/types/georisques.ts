import type { CommuneQualiteAir } from "./qualiteAir";
import type { CommuneRisques } from "./risques";

export interface GeorisquesData {
	risques?: CommuneRisques;
	qualiteAir?: CommuneQualiteAir;
}
