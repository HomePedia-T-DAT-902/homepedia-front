import type { CommuneSecurite } from "../types/securite";
import { createCommuneRepository } from "./createCommuneRepository";

export const securiteRepository =
	createCommuneRepository<CommuneSecurite>("securite");
