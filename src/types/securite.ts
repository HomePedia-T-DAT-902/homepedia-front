export interface SecuriteAnnee {
	annee: number;
	cambriolages_nombre: number | null;
	cambriolages_pour_mille: number | null;
	violences_nombre: number | null;
	violences_pour_mille: number | null;
	vols_nombre: number | null;
	vols_pour_mille: number | null;
	stups_nombre: number | null;
	stups_pour_mille: number | null;
	destructions_nombre: number | null;
	destructions_pour_mille: number | null;
}

export interface CommuneSecurite {
	code_commune: string;
	historique: SecuriteAnnee[];
}
