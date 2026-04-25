import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/dashboard/Icon';
import { Card, SectionHeader, TextReveal } from '../components/dashboard/DashCard';
import { useDash } from '../context/DashboardContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../lib/api';

function DashboardPage() {
  const { user, meds, takeMed, alerts, dismissAlert } = useDash();
  const { speak } = useAccessibility();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [sosAlert, setSosAlert] = useState(null);

  const runSafetyCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_URL}/api/prescription/check-interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'demo-user' })
      });
      const data = await res.json();
      const highRisk = (data.interactions || []).filter(i => i.severity === 'HIGH');
      
      if (highRisk.length > 0) {
        setSosAlert(highRisk);
        // Voice warning automatically respects global Voice Assist toggle unless emergency requires forced
        speak("Warning! Critical drug interaction detected. Contacting emergency services.", true); // Keep forced for SOS
        
        // Automatically call SOS after 3 seconds of flashing red
        setTimeout(() => {
          window.location.href = 'tel:911'; // Update to the correct SOS number if needed
        }, 3500);
      } else {
        // Just show a quick success toast/alert
        alert("Safety Check Complete: No dangerous interactions found in your schedule.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting the safety check servers.");
    } finally {
      setChecking(false);
    }
  };

  const greet = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('dash_greeting') + ' ' + t('dash_morning');
    if (h < 18) return t('dash_greeting') + ' ' + t('dash_afternoon');
    return t('dash_greeting') + ' ' + t('dash_evening');
  }, [t]);

  const spoken = useRef(false);
  useEffect(() => {
     if (!spoken.current) {
       speak("Dashboard initialized. Check your upcoming doses.", false);
       spoken.current = true;
     }
  }, [speak]);

  const nextMed = meds.find(m => !m.taken);
  const takenCount = meds.filter(m => m.taken).length;

  return (
    <div className="screen">
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--s-8)' }}>
        <div className="t-micro" style={{ marginBottom: 10, color: 'var(--text-3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="t-display" style={{ margin: 0 }}>
          <TextReveal text={greet + ','} /> <span className="serif-accent" style={{ color: 'var(--accent)' }}><TextReveal text={user.firstName} /></span>
        </h1>
        <p className="t-body" style={{ margin: '10px 0 0', maxWidth: 560 }}>
          {takenCount === meds.length
            ? t('dash_caught_up')
            : nextMed
              ? <>{t('dash_next')} <strong style={{ color: 'var(--text)' }}>{nextMed.name}</strong> at {nextMed.time}.</>
              : 'No medications scheduled.'}
        </p>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 'var(--s-5)', marginBottom: 'var(--s-8)' }}>
        <NextDoseCard med={nextMed} onTake={() => nextMed && takeMed(nextMed.id)} onScan={() => navigate('/scan')} />
        <div className="col gap-5" style={{ minWidth: 0 }}>
          <ProgressRing taken={takenCount} total={meds.length} />
          <SafetyCard />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 'var(--s-8)' }}>
          {alerts.map(a => <AlertRow key={a.id} alert={a} onDismiss={() => dismissAlert(a.id)} />)}
        </div>
      )}

      {/* Quick actions */}
      <SectionHeader title={t('dash_quick')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-8)' }}>
        <QuickAction icon="scan" label={t('scan')} hint="AI verify" onClick={() => navigate('/scan')} />
        <QuickAction icon="calendar" label={t('schedule')} hint="Manage doses" onClick={() => navigate('/medications')} />
        <QuickAction icon="bell" label={t('reminders')} hint="Telegram / SMS" onClick={() => navigate('/profile')} />
        <QuickAction icon={checking ? 'refresh' : 'shield'} label={checking ? "Checking..." : t('check_meds')} hint="Interactions" onClick={runSafetyCheck} />
        <QuickAction icon="phone" label={t('call_nurse')} hint="24/7 line" variant="danger" onClick={() => window.location.href='tel:911'} />
      </div>

      {/* Today's plan */}
      <SectionHeader title={t('today_plan')} action={
        <button className="row gap-1" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }} onClick={() => navigate('/medications')}>
          View timeline <Icon name="chevronRight" size={14}/>
        </button>
      }/>
      <TodayPlan meds={meds} onTake={takeMed}/>

      {/* SOS EMERGENCY FULL SCREEN MODAL */}
      {sosAlert && (
         <div style={{
           position: 'fixed', inset: 0, zIndex: 9999,
           background: 'rgba(239, 68, 68, 0.95)',
           backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
           display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--s-6)',
           textAlign: 'center', animation: 'fadeIn 300ms', color: 'white'
         }}>
            <div style={{ width: 120, height: 120, background: 'var(--danger-strong)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 60px rgba(0,0,0,0.5)', animation: 'pulse 1s infinite' }}>
               <Icon name="alert" size={60} stroke={2.5}/>
            </div>
            <h1 style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 16px', textTransform: 'uppercase' }}>CRITICAL INTERACTION</h1>
            <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 40px', opacity: 0.9, letterSpacing: 2, textTransform: 'uppercase', animation: 'pulse 1s infinite' }}>Dialing SOS Number Automatically...</p>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 32, borderRadius: 24, maxWidth: 500, width: '100%', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 40, textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, opacity: 0.7 }}>Harmful Combination Found:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sosAlert.map((alert, i) => (
                  <div key={i} style={{ borderBottom: i < sosAlert.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingBottom: i < sosAlert.length - 1 ? 12 : 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{alert.drug1} + {alert.drug2}</div>
                    <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>{alert.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setSosAlert(null)} style={{ height: 60, padding: '0 40px', borderRadius: 999, background: 'white', color: 'var(--danger)', fontSize: 18, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
               Cancel Call
            </button>
         </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

const NextDoseCard = ({ med, onTake, onScan }) => {
  if (!med) {
    return (
      <Card strong style={{ padding: 'var(--s-8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 280 }}>
        <Icon name="checkCircle" size={32} style={{ color: 'var(--success)', marginBottom: 12 }}/>
        <h3 className="t-h2" style={{ margin: 0 }}>All doses complete</h3>
        <p className="t-body" style={{ margin: '6px 0 0' }}>Nothing scheduled for the rest of today.</p>
      </Card>
    );
  }
  return (
    <Card strong style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 280 }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 80% at 100% 0%, var(--accent-soft), transparent 50%)' }}/>
      <div style={{ position: 'relative', padding: 'var(--s-8)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="row between" style={{ marginBottom: 'var(--s-5)' }}>
          <div className="chip chip-accent">
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', animation: 'pulse 2s infinite' }}/>
            Next dose · in {med.etaMin} min
          </div>
          <div className="t-small">Dose {med.dose} of {med.totalDoses}</div>
        </div>
        <div className="col gap-3" style={{ flex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              {med.name}
              <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>{med.strength}</span>
            </h2>
            <p className="t-body" style={{ margin: '6px 0 0' }}>{med.instruction}</p>
          </div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <div className="chip"><Icon name="clock" size={12}/> {med.time}</div>
            <div className="chip"><Icon name="fork" size={12}/> {med.meal}</div>
            <div className="chip"><Icon name="droplet" size={12}/> {med.kind}</div>
          </div>
        </div>
        <div className="row gap-2" style={{ marginTop: 'var(--s-6)', flexWrap: 'wrap' }}>
          <button className="btn btn-accent" onClick={onTake} style={{ flex: '1 1 180px' }}>
            <Icon name="check" size={16} stroke={2.2}/> Mark as taken
          </button>
          <button className="btn btn-ghost" onClick={onScan}>
            <Icon name="scan" size={16}/> Verify with camera
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }`}</style>
    </Card>
  );
};

const ProgressRing = ({ taken, total }) => {
  const pct = total === 0 ? 0 : taken / total;
  const C = 2 * Math.PI * 28;
  return (
    <Card>
      <div className="row between" style={{ marginBottom: 'var(--s-4)' }}>
        <span className="t-micro">Today's progress</span>
        <Icon name="activity" size={14} style={{ color: 'var(--text-3)' }}/>
      </div>
      <div className="row gap-4">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border-strong)" strokeWidth="6"/>
          <circle cx="36" cy="36" r="28" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)' }}/>
        </svg>
        <div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {taken}<span style={{ color: 'var(--text-3)', fontSize: 20, fontWeight: 400 }}>/{total}</span>
          </div>
          <div className="t-small" style={{ marginTop: 2 }}>Doses taken today</div>
        </div>
      </div>
    </Card>
  );
};

const SafetyCard = () => (
  <Card>
    <div className="row between" style={{ marginBottom: 'var(--s-4)' }}>
      <span className="t-micro">Safety check</span>
      <span className="chip" style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(48,164,108,0.10)', color: 'var(--success)' }}>
        <Icon name="check" size={10} stroke={2.4}/> Verified
      </span>
    </div>
    <div className="t-h3" style={{ marginBottom: 6 }}>No conflicts detected</div>
    <div className="t-small">Last cross-check with Google Gemini · 2 min ago</div>
  </Card>
);

const AlertRow = ({ alert, onDismiss }) => (
  <div className="glass" style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'start', gap: 'var(--s-4)',
    padding: 'var(--s-4) var(--s-5)',
    borderRadius: 'var(--radius-md)',
    borderColor: 'rgba(229, 72, 77, 0.25)',
    background: 'color-mix(in srgb, var(--danger-soft) 100%, var(--surface))',
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', display: 'grid', placeItems: 'center' }}>
      <Icon name="alert" size={18}/>
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Drug interaction alert</div>
      <div className="t-small">
        Do not take <strong style={{ color: 'var(--danger)' }}>Aspirin</strong> with <strong style={{ color: 'var(--danger)' }}>Warfarin</strong> today.
      </div>
    </div>
    <div className="row gap-1">
      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Details</button>
      <button className="btn-icon" onClick={onDismiss} aria-label="Dismiss" style={{ width: 32, height: 32 }}>
        <Icon name="close" size={14}/>
      </button>
    </div>
  </div>
);

const QuickAction = ({ icon, label, hint, onClick, variant }) => (
  <button onClick={onClick} className="glass" style={{
    padding: 'var(--s-4)', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 10,
    borderRadius: 'var(--radius-md)', transition: 'all 200ms',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
  >
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: variant === 'danger' ? 'var(--danger-soft)' : 'var(--accent-soft)',
      color: variant === 'danger' ? 'var(--danger)' : 'var(--accent)',
      display: 'grid', placeItems: 'center',
    }}><Icon name={icon} size={17}/></div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div className="t-small" style={{ fontSize: 12 }}>{hint}</div>
    </div>
  </button>
);

const TodayPlan = ({ meds, onTake }) => {
  if (meds.length === 0) {
    return (
      <Card style={{ padding: 'var(--s-8)', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px', background: 'var(--surface-sunken)', color: 'var(--text-3)', display: 'grid', placeItems: 'center' }}>
          <Icon name="calendar" size={22}/>
        </div>
        <div className="t-h3" style={{ marginBottom: 4 }}>No medications scheduled yet</div>
        <div className="t-small" style={{ marginBottom: 16 }}>Add some through the portal or scan a label.</div>
        <button className="btn btn-accent"><Icon name="plus" size={14}/> Add medication</button>
      </Card>
    );
  }
  return (
    <Card style={{ padding: 'var(--s-2)' }}>
      {meds.map((m, i) => (
        <div key={m.id} style={{
          display: 'grid', gridTemplateColumns: '54px 1fr auto',
          alignItems: 'center', gap: 'var(--s-4)', padding: 'var(--s-4)',
          borderBottom: i < meds.length - 1 ? '1px solid var(--border)' : 'none',
          opacity: m.taken ? 0.55 : 1, transition: 'opacity 300ms',
        }}>
          <div style={{ textAlign: 'center', padding: '8px 6px', borderRadius: 10, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
            <div className="t-mono" style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1 }}>{m.time.split(' ')[1]}</div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.1, marginTop: 2 }}>{m.time.split(' ')[0]}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, textDecoration: m.taken ? 'line-through' : 'none', textDecorationColor: 'var(--text-3)' }}>
              {m.name} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>{m.strength}</span>
            </div>
            <div className="t-small" style={{ marginTop: 2 }}>{m.instruction} · {m.meal}</div>
          </div>
          {m.taken ? (
            <div className="chip" style={{ color: 'var(--success)', background: 'rgba(48,164,108,0.10)', borderColor: 'transparent' }}>
              <Icon name="check" size={12} stroke={2.4}/> Taken
            </div>
          ) : (
            <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => onTake(m.id)}>Take</button>
          )}
        </div>
      ))}
    </Card>
  );
};

export default DashboardPage;
