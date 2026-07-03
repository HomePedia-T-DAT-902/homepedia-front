export interface WordCloudEntry {
	mot: string;
	frequence: number;
}

export interface ReviewSummary {
	code_commune: string;
	note_globale: number | null;
	word_cloud: WordCloudEntry[];
}
