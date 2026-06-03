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
    setDone(next);

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
      setDone(new Set(done));
    }
    setBusy(null);
  }

  const completed = steps.filter((s) => done.has(s.key)).length;
  const pct = Math.round((completed / steps.length) * 100);

  const card = {
    background: 'rgba(10,20,45,0.95)',
    backdropFilter: 'blur(16px)',
    borderRadius: 16,
    border: '1px solid rgba(50,80,140,0.3)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.35)',
    padding: 24,
  };

  if (loading) {
    return <div style={{ ...card, color: '#4a7090', fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7090', letterSpacing: '0.12em' }}>
          GETTING STARTED
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#8fd0ff' }}>
          {completed}/{steps.length}
        </span>
      </div>

      <div style={{ height: 6, background: 'rgba(50,80,140,0.25)', borderRadius: 4, marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#4a90d9', transition: 'width .2s' }} />
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((s) => {
          const checked = done.has(s.key);
          return (
            <li key={s.key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', opacity: busy === s.key ? 0.5 : 1 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={busy === s.key}
                  onChange={() => toggle(s.key)}
                  style={{ width: 17, height: 17, accentColor: '#4a90d9', cursor: 'pointer' }}
                />
                <span style={{
                  fontSize: 14,
                  textDecoration: checked ? 'line-through' : 'none',
                  color: checked ? '#4a7090' : '#cfe3f2',
                }}>
                  {s.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {pct === 100 && (
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(74,144,217,0.12)', border: '1px solid rgba(74,144,217,0.3)', borderRadius: 8, color: '#8fd0ff', fontSize: 13 }}>
          All set — onboarding complete.
        </div>
      )}
    </div>
  );
}
