export interface CommuneQualiteAir {
	code_commune: string;
	annee: number | null;
	indice_atmo: number | null;
	nb_jours_bon: number | null;
	nb_jours_moyen: number | null;
	nb_jours_degrade: number | null;
	nb_jours_mauvais: number | null;
	nb_jours_tres_mauvais: number | null;
	nb_jours_extremement_mauvais: number | null;
}
