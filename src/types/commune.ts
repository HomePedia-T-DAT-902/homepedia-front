export interface CommuneDetail {
	code_commune: string;
	nom: string;
	code_postal: string | null;
	nom_departement: string | null;
	nom_region: string | null;
	code_departement: string | null;
	code_region: string | null;
	population: number | null;
	superficie: number | null;
}
