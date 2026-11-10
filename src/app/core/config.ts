/**
 * Demo feature flags. Change here, no component edits needed.
 */
export const APP_CONFIG = {
  /**
   * Client portal "spending overview": show EGP amounts next to the % split?
   * Showing amounts lets a client subtract them from what they paid and infer the margin.
   * false = percentages only. (Business decision to confirm - see docs/ASSUMPTIONS.md)
   */
  portalShowSpendAmounts: true,
  /** Simulated latency of every "save" (ms). */
  saveDelayMs: 400,
  /** Simulated first-load skeleton time (ms). */
  loadingDelayMs: 450,
  /** Budget-used % at which progress bars turn amber / red. */
  budgetWarnPct: 85,
  budgetOverPct: 100,
};
