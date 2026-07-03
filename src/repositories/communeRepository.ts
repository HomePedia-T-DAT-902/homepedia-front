import type { CommuneDetail } from "../types/commune";
import { createCommuneRepository } from "./createCommuneRepository";

export const communeRepository =
	createCommuneRepository<CommuneDetail>("communes");
