// Same timeout ceiling as useSupabaseQuery.js's DEFAULT_TIMEOUT_MS — a
// realistic round-trip budget for a hosted API (Supabase or another
// Wegn product's own endpoint).
export const DEFAULT_TIMEOUT_MS = 8000;
export const TIMEOUT_MESSAGE = "Request timed out. Please check your connection and try again.";

// Mirrors useSupabaseQuery.js's attempt/retry pattern for read-only
// calls: races against a timeout and retries once, since a lost race is
// usually just one slow round trip, not a real failure. Extracted here
// (originally defined only in PartnerPortal.jsx for submitLead()/
// recruitPromotor()) so any other read call — e.g. the lead-eligible
// products fetch in useLeadProducts.js — reuses the exact same
// behavior instead of a parallel reimplementation.
export async function withTimeoutRetry(fn, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const attemptOnce = async () => {
    const timedOut = Symbol("timed-out");
    const timeout = new Promise((resolve) => setTimeout(() => resolve(timedOut), timeoutMs));
    const result = await Promise.race([fn(), timeout]);
    if (result === timedOut) throw new Error(TIMEOUT_MESSAGE);
    return result;
  };

  try {
    return await attemptOnce();
  } catch (firstAttemptError) {
    return await attemptOnce();
  }
}

// Same timeout as above but WITHOUT a retry — used for non-idempotent
// mutations (the leads/promotors insert). A timed-out insert may already
// have committed server-side with only the response lost on a bad
// mobile connection (confirmed for the Filmon Zeru lead, 2026-07-11);
// auto-retrying a mutation in that state would risk creating a
// duplicate row, so a timeout here surfaces an error for the caller to
// retry manually instead of resubmitting automatically.
export async function withTimeout(fn, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const timedOut = Symbol("timed-out");
  const timeout = new Promise((resolve) => setTimeout(() => resolve(timedOut), timeoutMs));
  const result = await Promise.race([fn(), timeout]);
  if (result === timedOut) throw new Error(TIMEOUT_MESSAGE);
  return result;
}
