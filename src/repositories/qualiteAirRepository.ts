import type { CommuneQualiteAir } from "../types/qualiteAir";
import { createCommuneRepository } from "./createCommuneRepository";

export const qualiteAirRepository = createCommuneRepository<CommuneQualiteAir>(
	"qualite-air",
);
