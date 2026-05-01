export const MAX_OBSERVATION_FILES = 5;

export type ObservationType = "Flora" | "Fauna";

/** Sub-categories per type (adjust to match your CEMO taxonomy). */
export const OBSERVATION_CATEGORY_OPTIONS: Record<
  ObservationType,
  readonly string[]
> = {
  Flora: [
    "Trees",
    "Shrubs",
    "Herbs / understory",
    "Grasses",
    "Ferns",
    "Flowering plants",
    "Vines / lianas",
    "Other flora",
  ],
  Fauna: [
    "Birds",
    "Mammals",
    "Reptiles",
    "Amphibians",
    "Fish",
    "Insects / arthropods",
    "Other fauna",
  ],
};
