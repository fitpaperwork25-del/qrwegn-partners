import { useCallback, useEffect, useState } from "react";

const DEFAULT_TIMEOUT_MS = 2500;

// Shared data-fetching hook — the permanent fix for pages hanging on
// "Loading..." forever. This same class of bug was fixed once, by hand,
// in AdminDashboard.jsx (commit 2c561f1, "race partners fetch against
// 2.5s timeout, setLoading false in finally so dashboard always
// renders") but was never extracted into something reusable, so every
// page written afterward (Leads, Clients, Commissions, Payouts,
// Analytics, Reports, Notifications, Materials, the dashboard) repeated
// the same unguarded `Promise.all(...).then(...)` pattern with no
// timeout and no `.catch()` — meaning any single rejected or hanging
// query leaves that page stuck loading forever, with no error shown.
//
// queryFn is any async function performing whatever Supabase calls it
// needs (one query or several, via its own internal Promise.all) and
// returning whatever shape of data the page wants — this hook doesn't
// care about that shape, it only guarantees three things no matter what
// queryFn does: a hard timeout, an error is always surfaced (never
// silently swallowed), and loading is always resolved (finally), even
// if the component unmounts before the query settles.
export function useSupabaseQuery(queryFn, deps = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumping this re-runs the effect below with the exact same
  // timeout/error/cancellation guarantees — lets a page manually
  // refresh its data (e.g. after saving a new record) without
  // reintroducing a hand-rolled fetch alongside this hook.
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const timedOut = Symbol("timed-out");
        const timeout = new Promise(resolve => setTimeout(() => resolve(timedOut), timeoutMs));
        const result = await Promise.race([queryFn(), timeout]);

        if (cancelled) return;

        if (result === timedOut) {
          setError(new Error("Request timed out."));
        } else {
          setData(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchIndex]);

  const refetch = useCallback(() => setRefetchIndex(i => i + 1), []);

  return { data, loading, error, refetch };
}
