import type { CommuneEquipements } from "../types/equipements";
import { createCommuneRepository } from "./createCommuneRepository";

export const equipementRepository =
	createCommuneRepository<CommuneEquipements>("equipements");
