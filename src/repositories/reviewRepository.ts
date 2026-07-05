import type { ReviewSummary } from "../types/reviews";
import { createCommuneRepository } from "./createCommuneRepository";

export const reviewRepository =
	createCommuneRepository<ReviewSummary>("reviews");
