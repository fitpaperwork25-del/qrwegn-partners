import { useState } from "react";

// Branded login screen — presentational only. Auth logic (signIn, state)
// lives in App.jsx and is passed in unchanged via props. Local state here
// (password visibility, "remember me" checkbox) is purely cosmetic and
// never touches auth, routing, or Supabase.

const ICON_PROPS = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

const MailIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
const LockIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
const EyeIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M3 3l18 18" /><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);
const PeopleIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 8.3a3 3 0 1 1 3.4 3.9" /><path d="M21.5 20c0-2.9-1.9-5.1-4.6-5.8" /></svg>
);
const TrendUpIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 6h6v6" /></svg>
);
const CoinIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v9M9.5 9.7c0-1.3 1.1-2.2 2.5-2.2s2.5.8 2.5 2c0 2.6-5 1.4-5 4 0 1.2 1.1 2 2.5 2s2.5-.9 2.5-2.2" /></svg>
);
const ShieldCheckIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
const ShieldPersonIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" /><circle cx="12" cy="10" r="2.1" /><path d="M8.7 15.5c.6-1.6 1.9-2.5 3.3-2.5s2.7.9 3.3 2.5" /></svg>
);
const HeadsetIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19v1a2 2 0 0 1-2 2h-3" /></svg>
);
const ArrowRightIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
const LinkIcon = (p) => (
  <svg {...ICON_PROPS} {...p}><path d="M9 15 15 9" /><path d="M10.5 6.5 12 5a4 4 0 1 1 5.7 5.7l-1.5 1.5" /><path d="M13.5 17.5 12 19a4 4 0 1 1-5.7-5.7l1.5-1.5" /></svg>
);

const FEATURES = [
  { key: "connect",  label: "Connect",  Icon: LinkIcon,        desc: "Bring businesses into the Wegn network." },
  { key: "grow",     label: "Grow",     Icon: TrendUpIcon,     desc: "Help businesses succeed with better tools." },
  { key: "earn",     label: "Earn",     Icon: CoinIcon,        desc: "Build recurring income from every success." },
  { key: "together", label: "Together", Icon: PeopleIcon,      desc: "Grow with a network built for shared success." },
];

export default function LoginScreen({ email, setEmail, password, setPassword, error, onSignIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#050b14]">
      <main className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 xl:grid-cols-[1fr_520px] gap-8 px-6 py-6 xl:items-center xl:px-10">

        {/* ── Left branded content ─────────────────────────────────── */}
        <section className="relative overflow-hidden text-white">
          {/* decorative background texture — absolute only, never affects layout */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
          </div>

          <div className="relative mb-5 sm:mb-6 inline-block">
            {/* Soft integrated glow behind the logo — not a box, just a gentle
                lift so the mark reads as an intentional brand anchor. The PNG's
                own near-black background already closely matches the page, and
                mix-blend-mode: screen removes any remaining seam at its edges. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 rounded-2xl"
              style={{
                background: "radial-gradient(ellipse at center, rgba(74,222,128,0.14), rgba(74,222,128,0.04) 55%, transparent 75%)",
                filter: "blur(6px)",
              }}
            />
            <img
              src="/wegn-logo.png"
              alt="Wegn"
              className="relative h-16 sm:h-20 w-auto max-w-full object-contain object-left block"
              style={{ mixBlendMode: "screen" }}
            />
          </div>

          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-[1.05] mb-3">
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #bef264, #4ade80)" }}
              >
                PARTNER NETWORK
              </span>
            </h1>

            <div className="text-base sm:text-lg font-medium text-slate-200 mb-3">
              <span className="relative pb-1.5">
                Connect
                <span className="absolute left-0 bottom-0 h-[3px] w-8 rounded-full" style={{ background: "#4ade80" }} />
              </span>
              . Grow. Earn.
            </div>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4 max-w-md">
              Help businesses grow. Create new opportunities.
              <br />
              Build your own success with Wegn.
            </p>

            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(134,239,172,0.35)", color: "#86efac" }}
            >
              <PeopleIcon width={16} height={16} />
              For Partners &amp; Promotors
            </span>
          </div>

          {/* Feature strip — wraps naturally as space shrinks */}
          <div className="relative mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.key}
                  className="rounded-xl p-3"
                  style={{ background: "rgba(74,222,128,0.07)", backdropFilter: "blur(3px)", border: "1px solid rgba(148,255,150,0.28)" }}
                >
                  <f.Icon width={18} height={18} style={{ color: "#a7f3d0", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} className="mb-1.5" />
                  <div className="text-sm font-bold" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{f.label}</div>
                  <div className="text-xs mt-1 leading-snug" style={{ color: "#dbe8f0", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note — part of normal flow, stacks under content */}
          <div className="relative mt-6 pt-4 border-t border-white/5 text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheckIcon width={14} height={14} style={{ color: "#86efac" }} />
              Secure · Trusted · Built for Growth
            </span>
            <span>© 2026 Wegn Group. All rights reserved.</span>
          </div>
        </section>

        {/* ── Login card ───────────────────────────────────────────── */}
        <section className="w-full max-w-[520px] justify-self-center xl:justify-self-end">
          <div
            className="w-full rounded-3xl px-7 py-8 sm:px-10 sm:py-10 text-white"
            style={{ background: "rgba(9,14,26,0.92)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10" style={{ background: "rgba(134,239,172,0.4)" }} />
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(134,239,172,0.4)" }}
              >
                <ShieldPersonIcon width={26} height={26} style={{ color: "#86efac" }} />
              </div>
              <span className="h-px w-10" style={{ background: "rgba(134,239,172,0.4)" }} />
            </div>

            <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white mb-1">Welcome Back!</h2>
            <p className="text-center text-sm text-slate-400 mb-5">Sign in to your Wegn Partner Network</p>

            <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
            <div className="relative mb-6">
              <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl pl-11 pr-3.5 py-3.5 outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb" }}
              />
            </div>

            <label className="block text-sm font-semibold text-slate-200 mb-2">Password</label>
            <div className="relative mb-6">
              <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl pl-11 pr-11 py-3.5 outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm mb-6">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: "#4ade80" }}
                />
                Remember me
              </label>
              <span className="cursor-default" style={{ color: "#86efac" }}>Forgot password?</span>
            </div>

            {error && (
              <div
                className="text-sm rounded-lg px-3.5 py-2.5 mb-5"
                style={{ background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.3)", color: "#f07070" }}
              >
                {error}
              </div>
            )}

            <button
              onClick={onSignIn}
              className="w-full rounded-xl py-4 font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(90deg, #4ade80, #a3e635)", color: "#0a1f0f" }}
            >
              Sign In
              <ArrowRightIcon />
            </button>

            <div className="flex items-center gap-3 my-5">
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs text-slate-500">OR</span>
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold"
              style={{ border: "1px solid rgba(134,239,172,0.35)", color: "#86efac" }}
            >
              <ShieldCheckIcon width={16} height={16} />
              Need access? Contact an administrator
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <HeadsetIcon width={14} height={14} />
              Help Center
            </span>
            <span className="opacity-40">|</span>
            <span>Privacy Policy</span>
            <span className="opacity-40">|</span>
            <span>Terms of Service</span>
          </div>
        </section>

      </main>
    </div>
  );
}
