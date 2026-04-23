/** Monthly order averages based on historical data 2022-2025 (from StatistikkRapport).
 *  Used as fallback when per-week historical data is missing. Index 0 = January. */
export const MONTHLY_AVERAGES = [
  54.75, // Jan
  44.00, // Feb
  52.75, // Mar
  38.00, // Apr
  41.75, // Mai
  34.00, // Jun
  22.75, // Jul
  53.00, // Aug
  37.75, // Sep
  52.25, // Okt
  61.75, // Nov
  27.75, // Des
] as const;

/** Lowercase first-name fragments for the core photographers — used to detect
 *  whether a selected owner is a "main" photographer when applying scale factors. */
export const MAIN_PHOTOGRAPHERS = ['børre', 'andreas', 'ina', 'annar', 'frode'] as const;
