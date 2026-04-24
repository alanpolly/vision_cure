import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/dashboard/Icon';
import { Card, SectionHeader, TextReveal } from '../components/dashboard/DashCard';
import { useDash } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

function ProfilePage() {
  const { user } = useDash();
  const { signOut, user: authUser } = useAuth();
  const { 
    largeText, highContrast, voiceGuidance, simpleMode,
    toggleLargeText, toggleHighContrast, toggleVoiceGuidance, toggleSimpleMode 
  } = useAccessibility();
  const navigate = useNavigate();
  const [telegramId, setTelegramId] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Load existing profile on mount
  useEffect(() => {
    if (!authUser?.id) return;
    fetch(`/api/user/profile/${authUser.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setTelegramId(data.profile.telegram_id || '');
          setCaregiverPhone(data.profile.caregiver_phone || '');
        }
      })
      .catch(err => console.error('Failed to load profile:', err));
  }, [authUser?.id]);

  const handleSave = async () => {
    if (!authUser?.id) return setStatusMsg('❌ Not logged in');
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, telegramId, caregiverPhone })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('✅ Saved! Telegram ID linked.');
      } else {
        setStatusMsg('❌ ' + (data.error || 'Save failed'));
      }
    } catch (err) {
      setStatusMsg('❌ Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramId) return setStatusMsg('❌ Enter Telegram ID first');
    setTesting(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/user/telegram-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('✅ Test message sent! Check Telegram.');
      } else {
        setStatusMsg('❌ ' + (data.error || 'Failed to send'));
      }
    } catch (err) {
      setStatusMsg('❌ Network error');
    } finally {
      setTesting(false);
    }
  };

  const handleTestSystemNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('VisionCure Test 💊', {
          body: 'This is a test system notification! Your phone will alert you like this when it is time.',
          icon: '/vite.svg',
          vibrate: [200, 100, 200]
        });
        setStatusMsg('✅ System notification sent! Look at your screen/phone.');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('VisionCure Test 💊', {
              body: 'Permissions granted! This is a test notification.',
              icon: '/vite.svg',
              vibrate: [200, 100, 200]
            });
            setStatusMsg('✅ Permission granted and test sent!');
          } else {
            setStatusMsg('❌ Notification permission denied.');
          }
        });
      } else {
        setStatusMsg('❌ Notifications are blocked in your browser settings.');
      }
    } else {
      setStatusMsg('❌ Your browser does not support system notifications.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const meInputStyle = {
    padding: '12px 14px', background: 'var(--surface-sunken)',
    border: '1px solid var(--border)', borderRadius: 12,
    fontSize: 15, fontWeight: 500, color: 'var(--text)',
    outline: 'none', width: '100%', fontFamily: 'inherit',
    letterSpacing: '-0.01em', transition: 'all 150ms',
  };

  return (
    <div className="screen">
      <div style={{ marginBottom: 'var(--s-8)' }}>
        <div className="t-micro" style={{ marginBottom: 10, color: 'var(--text-3)' }}>Account</div>
        <h1 className="t-display" style={{ margin: 0 }}>
          <TextReveal text="My " /><span className="serif-accent" style={{ color: 'var(--accent)', fontWeight: 900 }}><TextReveal text="profile" /></span>
        </h1>
        <p className="t-body" style={{ margin: '10px 0 0' }}>Manage your account and accessibility settings.</p>
      </div>

      {/* Profile card */}
      <Card strong style={{ marginBottom: 'var(--s-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 'var(--s-5)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, var(--accent), #0090A0)',
              display: 'grid', placeItems: 'center',
              color: 'white', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em',
              boxShadow: '0 8px 24px -8px var(--accent-glow)',
            }}>
              {user.firstName[0]}
            </div>
            <button style={{
              position: 'absolute', right: -4, bottom: -4,
              width: 28, height: 28, borderRadius: 999,
              background: 'var(--surface-solid)', border: '2px solid var(--bg)',
              color: 'var(--accent)', display: 'grid', placeItems: 'center',
              boxShadow: 'var(--shadow-sm)',
            }} aria-label="Edit photo">
              <Icon name="camera" size={13}/>
            </button>
          </div>
          <div>
            <div className="t-h2" style={{ margin: 0 }}>{user.firstName} {user.lastName}</div>
            <div className="t-small" style={{ marginTop: 2 }}>{user.email} · Patient ID {user.patientId}</div>
            <div className="row gap-2" style={{ marginTop: 10 }}>
              <span className="chip"><Icon name="heart" size={11}/> Cardiology</span>
              <span className="chip"><Icon name="activity" size={11}/> Active plan</span>
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost" onClick={handleLogout}>
              <Icon name="logout" size={14}/> Logout
            </button>
            <button className="btn btn-accent">
              <Icon name="settings" size={14}/> Devices
            </button>
          </div>
        </div>
      </Card>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 'var(--s-5)', marginBottom: 'var(--s-6)' }}>
        {/* Telegram reminders */}
        <Card>
          <div className="row gap-3" style={{ marginBottom: 'var(--s-4)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2AABEE, #229ED9)', color: 'white',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 14px -4px rgba(42, 171, 238, 0.4)',
            }}>
              <Icon name="send" size={20}/>
            </div>
            <div>
              <div className="t-h3">Telegram reminders</div>
              <div className="t-small">Get medication alerts on your phone</div>
            </div>
          </div>

          <div style={{ padding: 'var(--s-4)', background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 'var(--s-4)' }}>
            <div className="t-micro" style={{ color: 'var(--accent)', marginBottom: 8 }}>How to set up</div>
            <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.8, color: 'var(--text-2)' }}>
              <li>Open Telegram on your phone</li>
              <li>Search for <code style={{ color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>@userinfobot</code></li>
              <li>Send any message to the bot</li>
              <li>Copy the ID number and paste below</li>
            </ol>
          </div>

          <div className="col gap-3">
            <label className="col gap-2">
              <span className="t-micro" style={{ fontSize: 10 }}>Your Telegram ID</span>
              <input value={telegramId} onChange={e => setTelegramId(e.target.value)} style={meInputStyle}/>
            </label>
            <label className="col gap-2">
              <span className="t-micro" style={{ fontSize: 10 }}>Caregiver phone (for SOS)</span>
              <input value={caregiverPhone} onChange={e => setCaregiverPhone(e.target.value)} style={meInputStyle}/>
            </label>
            <div className="row gap-2" style={{ marginTop: 4 }}>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                <Icon name="check" size={14} stroke={2.2}/> {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-ghost" onClick={handleTestTelegram} disabled={testing} style={{ borderColor: '#2AABEE', color: '#2AABEE' }}>
                <Icon name="send" size={14}/> Test Telegram
              </button>
              <button className="btn btn-ghost" onClick={handleTestSystemNotification} style={{ borderColor: '#00b8a9', color: '#00b8a9' }}>
                <Icon name="bell" size={14}/> Test System Alert
              </button>
            </div>
            {statusMsg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: statusMsg.startsWith('✅') ? 'var(--accent)' : 'var(--danger)' }}>{statusMsg}</div>}
          </div>
        </Card>

        {/* Caregiver + SOS */}
        <div className="col gap-5">
          <Card strong style={{ padding: 'var(--s-6)', background: 'linear-gradient(135deg, rgba(0, 184, 169, 0.14), var(--surface-strong))' }}>
            <div className="t-micro" style={{ color: 'var(--accent)', marginBottom: 8 }}>Primary caregiver</div>
            <div className="t-h2" style={{ marginBottom: 4 }}>Caregiver</div>
            <div className="t-small" style={{ marginBottom: 'var(--s-4)' }}>Linked contact: {caregiverPhone || 'Not set'}</div>
            <div className="row gap-2">
              <button 
                className="btn btn-accent" 
                style={{ flex: 1 }} 
                onClick={() => caregiverPhone ? window.location.href = `tel:${caregiverPhone}` : alert('Please save a caregiver phone number first.')}
              >
                <Icon name="phone" size={14}/> Call Caregiver
              </button>
              <button 
                className="btn-icon" 
                style={{ width: 40, height: 40 }} 
                aria-label="Message"
                onClick={() => caregiverPhone ? window.location.href = `sms:${caregiverPhone}` : alert('Please save a caregiver phone number first.')}
              >
                <Icon name="send" size={15}/>
              </button>
            </div>
          </Card>

          <Card style={{ padding: 'var(--s-6)', borderColor: 'rgba(229, 72, 77, 0.25)', background: 'color-mix(in srgb, var(--danger-soft) 100%, var(--surface))' }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <div className="t-micro" style={{ color: 'var(--danger)' }}>Emergency</div>
              <Icon name="alert" size={14} style={{ color: 'var(--danger)' }}/>
            </div>
            <div className="t-h3" style={{ marginBottom: 4, color: 'var(--danger)' }}>SOS Emergency</div>
            <div className="t-small" style={{ marginBottom: 'var(--s-4)' }}>Instant alert to healthcare center + caregiver</div>
            <button
              onClick={() => { 
                setSosActive(true); 
                setTimeout(() => setSosActive(false), 2400); 
                
                // Trigger SMS first
                window.location.href = 'sms:112?body=EMERGENCY! I need immediate help. Sending from VisionCure App.';
                
                // Give the browser half a second to process the SMS intent before triggering the dialer
                setTimeout(() => {
                  window.location.href = 'tel:112';
                }, 500);
              }}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--danger)', color: 'white',
                fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                borderRadius: 999,
                boxShadow: sosActive ? '0 0 0 8px rgba(229, 72, 77, 0.2), 0 4px 14px -4px rgba(229, 72, 77, 0.5)' : '0 4px 14px -4px rgba(229, 72, 77, 0.4)',
                transition: 'all 200ms',
              }}>
              {sosActive ? 'Dialing 112...' : 'Activate SOS'}
            </button>
          </Card>
        </div>
      </div>

      {/* Accessibility */}
      <SectionHeader title="Accessibility tools"/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s-3)' }}>
        <A11yToggle icon="text" label="Large text" hint="25% size boost" value={largeText} onChange={toggleLargeText}/>
        <A11yToggle icon="contrast" label="High contrast" hint="Maximum visibility" value={highContrast} onChange={toggleHighContrast}/>
        <A11yToggle icon="volume" label="Voice assist" hint="AI audio guidance" value={voiceGuidance} onChange={toggleVoiceGuidance}/>
        <A11yToggle icon="grid" label="Simple view" hint="Maximum focus" value={simpleMode} onChange={toggleSimpleMode}/>
      </div>
    </div>
  );
}

const A11yToggle = ({ icon, label, hint, value, onChange }) => (
  <button onClick={() => onChange(!value)} className="glass" style={{
    display: 'grid', gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center', gap: 'var(--s-4)',
    padding: 'var(--s-4) var(--s-5)', borderRadius: 'var(--radius-md)',
    textAlign: 'left', transition: 'all 200ms',
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: value ? 'var(--accent-soft)' : 'var(--surface-sunken)',
      color: value ? 'var(--accent)' : 'var(--text-3)',
      display: 'grid', placeItems: 'center', transition: 'all 200ms',
    }}>
      <Icon name={icon} size={18}/>
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div className="t-small" style={{ fontSize: 12 }}>{hint}</div>
    </div>
    <div className={'switch ' + (value ? 'on' : '')}/>
  </button>
);

export default ProfilePage;
