import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Lock, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TOP_NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/codes', label: 'All Codes' },
  { to: '/', label: 'Projects' },
  { to: '/pricing', label: 'Pricing', active: true },
];

const PRICES = { pro: 149, team: 399 };

const formatPrice = (amount, isYearly) =>
  isYearly ? Math.round(amount * 0.8) : amount;

const FREE_FEATURES = [
  '4+ languages',
  '10 projects',
  'Public projects only',
  'Basic editor',
];

const PRO_FEATURES = [
  'Unlimited projects',
  'Private projects',
  'Custom themes',
  'Priority support',
];

const TEAM_FEATURES = [
  'Everything in Pro',
  'Share & collaborate',
  'Team workspaces',
  'Priority support',
];

const COMPARE_ROWS = [
  { feature: 'Projects', free: '10', pro: 'Unlimited', team: 'Unlimited' },
  { feature: 'Private projects', free: null, pro: true, team: true },
  { feature: 'Custom themes', free: null, pro: true, team: true },
  { feature: 'Collaborate', free: null, pro: null, team: true },
  { feature: 'Priority support', free: null, pro: true, team: true },
];

function CompareCell({ value }) {
  if (value === true) {
    return (
      <span style={{ color: '#7c6fff', fontSize: '17px', fontWeight: 700 }}>✓</span>
    );
  }
  if (value === null) {
    return <span style={{ color: '#2e2a4a', fontSize: '15px' }}>—</span>;
  }
  return <span className="pricing-compare-text">{value}</span>;
}

const Pricing = () => {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const proPrice = formatPrice(PRICES.pro, isYearly);
  const teamPrice = formatPrice(PRICES.team, isYearly);

  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=7c3aed&color=fff`;

  return (
    <div className="pricing-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@400;500;600&display=swap');

        .pricing-page {
          --bg: #0c0c10;
          --card: #13111e;
          --accent: #7c6fff;
          --text: #e8e6f0;
          --muted: #6b6880;
          --border: #1f1c2f;
          --pricing-top-header-h: 64px;
          min-height: 100vh;
          background-color: var(--bg);
          background-image:
            radial-gradient(ellipse 600px 400px at 50% -80px, rgba(108, 87, 255, 0.18), transparent 70%),
            linear-gradient(rgba(120, 100, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(120, 100, 255, 0.04) 1px, transparent 1px);
          background-size: auto, 48px 48px, 48px 48px;
          color: var(--text);
          font-family: 'Outfit', system-ui, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .pricing-top-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          height: var(--pricing-top-header-h);
          background: rgba(9, 9, 11, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid #27272a;
        }

        .pricing-top-header-inner {
          max-width: 1280px;
          height: 100%;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .pricing-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
          color: #fff;
          flex-shrink: 0;
        }

        .pricing-logo-icon {
          width: 2rem;
          height: 2rem;
          color: #7c5cff;
        }

        .pricing-logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }

        .pricing-top-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.75rem;
          flex: 1;
        }

        .pricing-top-nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #a1a1aa;
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
        }

        .pricing-top-nav-link:hover {
          color: #e4e4e7;
        }

        .pricing-top-nav-link--active {
          color: #a78bfa;
          text-decoration: underline;
          text-underline-offset: 6px;
          text-decoration-thickness: 2px;
        }

        .pricing-avatar-link {
          flex-shrink: 0;
          display: block;
          border-radius: 999px;
          transition: opacity 0.2s, box-shadow 0.2s;
        }

        .pricing-avatar-link:hover {
          opacity: 0.9;
          box-shadow: 0 0 0 2px rgba(124, 92, 252, 0.35);
        }

        .pricing-avatar {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid rgba(139, 92, 246, 0.35);
          display: block;
        }

        @media (max-width: 768px) {
          .pricing-top-nav {
            display: none;
          }

          .pricing-top-header-inner {
            padding: 0 1rem;
          }
        }

        .pricing-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: calc(var(--pricing-top-header-h) + 2rem) 1.5rem 4rem;
        }

        .pricing-hero {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .pricing-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1rem;
        }

        .pricing-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(2.25rem, 5vw, 3.25rem);
          line-height: 1.15;
          font-weight: 400;
          color: var(--text);
          margin: 0 0 1rem;
        }

        .pricing-title em {
          font-style: italic;
          display: block;
        }

        .pricing-subtitle {
          font-size: 1.0625rem;
          color: var(--muted);
          margin: 0;
        }

        .pricing-billing {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.875rem;
          margin-bottom: 2.75rem;
          flex-wrap: wrap;
        }

        .pricing-billing-label {
          font-size: 0.9375rem;
          color: var(--muted);
          transition: color 0.2s;
        }

        .pricing-billing-label.active {
          color: var(--text);
          font-weight: 500;
        }

        .pricing-toggle {
          position: relative;
          width: 52px;
          height: 28px;
          padding: 0;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--card);
          cursor: pointer;
          flex-shrink: 0;
        }

        .pricing-toggle:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .pricing-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 8px rgba(124, 111, 255, 0.45);
        }

        .pricing-toggle.yearly .pricing-toggle-knob {
          transform: translateX(24px);
        }

        .pricing-badge-off {
          font-family: 'DM Mono', monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.25rem 0.625rem;
          border-radius: 999px;
          background: rgba(124, 111, 255, 0.15);
          color: var(--accent);
          border: 1px solid rgba(124, 111, 255, 0.25);
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-bottom: 3rem;
        }

        @media (max-width: 900px) {
          .pricing-cards {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }
        }

        .pricing-card {
          position: relative;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1.75rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .pricing-card:hover {
          transform: translateY(-2px);
          border-color: rgba(124, 111, 255, 0.35);
        }

        .pricing-card--featured {
          background: #12101f;
          border: 1px solid rgba(124, 111, 255, 0.4);
        }

        .pricing-card--featured:hover {
          transform: translateY(-2px);
          border: 1px solid rgba(124, 111, 255, 0.4);
        }

        .pricing-popular {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .pricing-plan-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.5rem;
        }

        .pricing-plan-label--accent {
          color: var(--accent);
        }

        .pricing-tagline {
          font-size: 0.875rem;
          color: var(--muted);
          margin-bottom: 1.25rem;
        }

        .pricing-price-row {
          display: flex;
          align-items: baseline;
          gap: 0.15rem;
          margin-bottom: 1.5rem;
        }

        .pricing-currency {
          font-size: 1.125rem;
          color: var(--muted);
          align-self: flex-start;
          margin-top: 0.35rem;
        }

        .pricing-amount {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 2.75rem;
          line-height: 1;
          color: var(--text);
          font-variant-numeric: tabular-nums;
          transition: opacity 0.2s;
        }

        .pricing-period {
          font-size: 0.875rem;
          color: var(--muted);
          margin-left: 0.15rem;
        }

        .pricing-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
          margin-bottom: 1.5rem;
        }

        .pricing-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .pricing-btn--current {
          background: transparent;
          border-color: var(--border);
          color: var(--muted);
          cursor: default;
        }

        .pricing-btn--solid {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }

        .pricing-btn--solid:hover {
          background: #8f82ff;
          border-color: #8f82ff;
        }

        .pricing-btn--outline {
          background: transparent;
          border-color: var(--accent);
          color: var(--accent);
        }

        .pricing-btn--outline:hover {
          background: rgba(124, 111, 255, 0.08);
        }

        .pricing-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
        }

        .pricing-features li {
          padding-left: 12px;
          border-left: 2px solid rgba(124, 111, 255, 0.25);
          font-size: 0.875rem;
          color: var(--text);
        }

        .pricing-compare-wrap {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 1rem;
          overflow: hidden;
          margin-bottom: 2.5rem;
        }

        .pricing-compare-table {
          table-layout: fixed;
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .pricing-compare-table th,
        .pricing-compare-table td {
          text-align: center;
          vertical-align: middle;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .pricing-compare-table th:first-child,
        .pricing-compare-table td:first-child {
          text-align: left;
        }

        .pricing-compare-table thead th {
          font-weight: 600;
        }

        .pricing-compare-table thead th:first-child {
          color: var(--text);
        }

        .pricing-compare-table thead th:not(:first-child) {
          color: var(--muted);
        }

        .pricing-compare-table thead th.col-pro {
          color: var(--accent);
        }

        .pricing-compare-table tbody tr:last-child td {
          border-bottom: none;
        }

        .pricing-compare-table tbody tr:hover td {
          background: rgba(124, 111, 255, 0.04);
        }

        .pricing-compare-feature {
          color: var(--text);
        }

        .pricing-compare-text {
          color: var(--text);
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .pricing-compare-table th,
          .pricing-compare-table td {
            padding: 0.75rem 1rem;
            font-size: 0.8125rem;
          }
        }

        .pricing-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #45425a;
        }
      `}</style>

      <header className="pricing-top-header">
        <div className="pricing-top-header-inner">
          <Link to="/" className="pricing-logo">
            <Code2 className="pricing-logo-icon" strokeWidth={2} />
            <span className="pricing-logo-text">CodeFusion</span>
          </Link>

          <nav className="pricing-top-nav" aria-label="Main">
            {TOP_NAV_LINKS.map(({ to, label, active }) => (
              <Link
                key={to}
                to={to}
                className={`pricing-top-nav-link${active ? ' pricing-top-nav-link--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Link to="/settings" className="pricing-avatar-link" aria-label="Profile settings">
            <img src={avatarUrl} alt="" className="pricing-avatar" />
          </Link>
        </div>
      </header>

      <div className="pricing-inner">
        <header className="pricing-hero">
          <p className="pricing-eyebrow">Pricing</p>
          <h1 className="pricing-title">
            Write code.
            <em>Not invoices.</em>
          </h1>
          <p className="pricing-subtitle">Simple, honest pricing. No hidden fees.</p>
        </header>

        <div className="pricing-billing">
          <span className={`pricing-billing-label ${!isYearly ? 'active' : ''}`}>
            Monthly
          </span>
          <button
            type="button"
            className={`pricing-toggle ${isYearly ? 'yearly' : ''}`}
            onClick={() => setIsYearly((y) => !y)}
            aria-pressed={isYearly}
            aria-label={isYearly ? 'Switch to monthly billing' : 'Switch to yearly billing'}
          >
            <span className="pricing-toggle-knob" />
          </button>
          <span className={`pricing-billing-label ${isYearly ? 'active' : ''}`}>
            Yearly
          </span>
          {isYearly && <span className="pricing-badge-off">20% off</span>}
        </div>

        <div className="pricing-cards">
          <article className="pricing-card">
            <p className="pricing-plan-label">Free</p>
            <p className="pricing-tagline">For learning & exploring</p>
            <div className="pricing-price-row">
              <span className="pricing-currency">₹</span>
              <span className="pricing-amount">0</span>
              <span className="pricing-period">/ mo</span>
            </div>
            <button type="button" className="pricing-btn pricing-btn--current" disabled>
              Current plan
            </button>
            <ul className="pricing-features">
              {FREE_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>

          <article className="pricing-card pricing-card--featured">
            <span className="pricing-popular">
              <Star size={11} fill="currentColor" />
              Most Popular
            </span>
            <p className="pricing-plan-label pricing-plan-label--accent">Pro</p>
            <p className="pricing-tagline">For developers & creators</p>
            <div className="pricing-price-row">
              <span className="pricing-currency">₹</span>
              <span className="pricing-amount" key={proPrice}>
                {proPrice}
              </span>
              <span className="pricing-period">/ mo</span>
            </div>
            <button type="button" className="pricing-btn pricing-btn--solid">
              Upgrade to Pro
            </button>
            <ul className="pricing-features">
              {PRO_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>

          <article className="pricing-card">
            <p className="pricing-plan-label">Team</p>
            <p className="pricing-tagline">For teams & collaboration</p>
            <div className="pricing-price-row">
              <span className="pricing-currency">₹</span>
              <span className="pricing-amount" key={teamPrice}>
                {teamPrice}
              </span>
              <span className="pricing-period">/ mo</span>
            </div>
            <button type="button" className="pricing-btn pricing-btn--outline">
              Upgrade to Team
            </button>
            <ul className="pricing-features">
              {TEAM_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="pricing-compare-wrap">
          <table className="pricing-compare-table">
            <thead>
              <tr>
                <th>Compare Plans</th>
                <th>Free</th>
                <th className="col-pro">Pro</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="pricing-compare-feature">{row.feature}</td>
                  <td>
                    <CompareCell value={row.free} />
                  </td>
                  <td>
                    <CompareCell value={row.pro} />
                  </td>
                  <td>
                    <CompareCell value={row.team} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="pricing-footer">
          <Lock size={12} strokeWidth={2} />
          Secure payments · Cancel anytime
        </footer>
      </div>
    </div>
  );
};

export default Pricing;
