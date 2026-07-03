import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSupabaseQuery } from "./useSupabaseQuery";

// Regression coverage for the exact class of bug that broke this app
// twice: a Supabase query that never resolves (rejects or just hangs)
// used to leave a page's loading state stuck true forever, with no
// error shown. This test asserts the shared hook cannot repeat that —
// loading must always resolve, and a hanging query must surface an
// error, without needing real time to pass.
describe("useSupabaseQuery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves loading to false and returns data when the query succeeds", async () => {
    const queryFn = () => Promise.resolve({ leads: [{ id: 1 }] });
    const { result } = renderHook(() => useSupabaseQuery(queryFn, []));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual({ leads: [{ id: 1 }] });
  });

  it("never leaves loading stuck true when the query hangs forever — the exact bug this hook exists to prevent", async () => {
    // A promise that never settles — this is what a hanging/rejected
    // Supabase request looked like before this fix, and it used to leave
    // pages stuck on "Loading..." permanently.
    const hangingQueryFn = () => new Promise(() => {});
    const { result } = renderHook(() => useSupabaseQuery(hangingQueryFn, [], 2500));

    expect(result.current.loading).toBe(true);

    // Advance past the hook's own timeout without waiting real time.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBe(null);
    expect(result.current.error.message).toMatch(/timed out/i);
  });

  it("surfaces a thrown/rejected query as an error instead of hanging or failing silently", async () => {
    const failingQueryFn = () => Promise.reject(new Error("network failure"));
    const { result } = renderHook(() => useSupabaseQuery(failingQueryFn, []));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBe(null);
    expect(result.current.error.message).toBe("network failure");
  });

  it("refetch() re-runs the query with the same timeout/error guarantees", async () => {
    let callCount = 0;
    const queryFn = () => {
      callCount += 1;
      return Promise.resolve({ count: callCount });
    };
    const { result } = renderHook(() => useSupabaseQuery(queryFn, []));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.data).toEqual({ count: 1 });

    act(() => {
      result.current.refetch();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(callCount).toBe(2);
    expect(result.current.data).toEqual({ count: 2 });
  });
});
