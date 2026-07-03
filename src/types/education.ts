export interface EducationAnnee {
	annee: number;
	bac_presents: number | null;
	bac_taux_reussite: number | null;
}

export interface CommuneEducation {
	code_commune: string;
	historique: EducationAnnee[];
}
