import { useEffect, useState } from 'react';

const STEPS = {
  partner: [
    { key: 'profile', label: 'Complete your profile' },
    { key: 'overview', label: 'Watch the platform overview' },
    { key: 'commissions', label: 'Review the commission structure' },
    { key: 'recruit', label: 'Recruit your first promotor' },
    { key: 'first_lead', label: 'Submit your first lead' },
    { key: 'payout', label: 'Add your payout details' },
  ],
  promotor: [
    { key: 'profile', label: 'Complete your profile' },
    { key: 'training', label: 'Watch the sales training' },
    { key: 'materials', label: 'Review demo links & materials' },
    { key: 'first_lead', label: 'Submit your first lead' },
    { key: 'payout', label: 'Add your payout details' },
  ],
};

export default function OnboardingChecklist({ supabase, userId, role = 'promotor' }) {
  const steps = STEPS[role] || STEPS.promotor;
  const [done, setDone] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('step_key')
        .eq('user_id', userId);
      if (active && !error) {
        setDone(new Set((data || []).map((r) => r.step_key)));
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase, userId]);

  async function toggle(stepKey) {
    if (busy) return;
    setBusy(stepKey);
    const isDone = done.has(stepKey);
    const next = new Set(done);
    if (isDone) next.delete(stepKey); else next.add(stepKey);
    setDone(next); // optimistic

    let error;
    if (isDone) {
      ({ error } = await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', userId)
        .eq('step_key', stepKey));
    } else {
      ({ error } = await supabase
        .from('onboarding_progress')
        .upsert(
          { user_id: userId, step_key: stepKey, completed: true },
          { onConflict: 'user_id,step_key' }
        ));
    }

    if (error) {
      // revert on failure
      const reverted = new Set(done);
      setDone(reverted);
    }
    setBusy(null);
  }

  const completed = steps.filter((s) => done.has(s.key)).length;
  const pct = Math.round((completed / steps.length) * 100);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 520, padding: 20, border: '1px solid #e5e5e5', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Getting started</h3>
        <span style={{ fontSize: 14, color: '#666' }}>{completed}/{steps.length}</span>
      </div>

      <div style={{ height: 6, background: '#eee', borderRadius: 4, marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#16a34a', transition: 'width .2s' }} />
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((s) => {
          const checked = done.has(s.key);
          return (
            <li key={s.key} style={{ marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: busy === s.key ? 0.6 : 1 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={busy === s.key}
                  onChange={() => toggle(s.key)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ textDecoration: checked ? 'line-through' : 'none', color: checked ? '#999' : '#111' }}>
                  {s.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {pct === 100 && (
        <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, color: '#166534', fontSize: 14 }}>
          All set — onboarding complete.
        </div>
      )}
    </div>
  );
}
