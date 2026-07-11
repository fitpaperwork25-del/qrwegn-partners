import { useEffect, useState } from "react";
import { withTimeoutRetry } from "../lib/withTimeout";

// Platform Admin's production origin — same convention as
// src/lib/supabase.js: read from the Vite-injected env var first, with
// a literal fallback to the real, verified production URL (confirmed
// via `vercel inspect` against the linked wegn-platform-admin project,
// 2026-07-11) so a missing env var degrades to "still works," not
// "silently broken."
const PLATFORM_ADMIN_URL =
  import.meta.env.VITE_PLATFORM_ADMIN_URL || "https://wegn-platform-admin.vercel.app";
const LEAD_PRODUCTS_ENDPOINT = `${PLATFORM_ADMIN_URL}/api/products/lead-eligible`;

const CACHE_KEY = "qrwegn-partners:lead-eligible-products";
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { products, cachedAt } = JSON.parse(raw);
    if (!Array.isArray(products) || typeof cachedAt !== "number") return null;
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
    return products;
  } catch {
    return null;
  }
}

function writeCache(products) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ products, cachedAt: Date.now() }));
  } catch {
    // sessionStorage unavailable (private browsing, quota exceeded) —
    // caching is best-effort only and never blocks the fetch/fallback
    // path below.
  }
}

// Fetches Platform Admin's Ecosystem Registry for the subset of
// products marked acceptsLeads: true, for the Partner Portal's
// "Product Interested In" dropdown. The product list itself is never
// hardcoded here — this hook only ever renders whatever Platform Admin
// currently reports.
//
// Resilience, in order:
// 1. Live fetch — one timeout + one retry, reusing the exact same
//    withTimeoutRetry already used by submitLead()/recruitPromotor().
// 2. On failure, the last successful response cached this browser
//    session (sessionStorage, 5 minute TTL) — a brief Platform Admin
//    outage doesn't block lead submission for a partner already using
//    the form.
// 3. On failure with nothing cached, an empty list plus
//    `unavailable: true` — PartnerPortal.jsx then treats product
//    selection as optional rather than blocking the form entirely, so
//    the lead still submits (see submitLead()'s insert payload, which
//    omits `product` in that case and lets the existing DB column
//    default apply, unchanged from before this feature existed).
export function useLeadProducts() {
  const [products, setProducts] = useState(() => readCache() ?? []);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await withTimeoutRetry(async () => {
          const res = await fetch(LEAD_PRODUCTS_ENDPOINT, { method: "GET" });
          if (!res.ok) throw new Error(`Platform Admin returned ${res.status}`);
          return res.json();
        });

        if (cancelled) return;
        const fetched = Array.isArray(data?.products) ? data.products : [];
        setProducts(fetched);
        setUnavailable(false);
        writeCache(fetched);
      } catch (e) {
        if (cancelled) return;
        console.warn("useLeadProducts: falling back —", e?.message || e);
        const cached = readCache();
        if (cached) {
          setProducts(cached);
          setUnavailable(false);
        } else {
          setProducts([]);
          setUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, unavailable };
}
