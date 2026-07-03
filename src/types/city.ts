import type { CommuneEquipements } from "./equipements";
import type { EducationAnnee } from "./education";
import type { SecuriteAnnee } from "./securite";
import type { WordCloudEntry } from "./reviews";

export interface CityData {
	nom: string;
	codePostal?: string;
	population?: number;
	codeDepartement?: string;
	nomDepartement?: string;
	codeRegion?: string;
	nomRegion?: string;
	superficie?: number;
	noteGlobale?: number;
	wordCloud?: WordCloudEntry[];
	equipements?: CommuneEquipements;
	securite?: SecuriteAnnee;
	education?: EducationAnnee;
}
