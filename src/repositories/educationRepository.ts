import type { CommuneEducation } from "../types/education";
import { createCommuneRepository } from "./createCommuneRepository";

export const educationRepository =
	createCommuneRepository<CommuneEducation>("education");
