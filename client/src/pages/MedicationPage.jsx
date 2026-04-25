import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/dashboard/Icon';
import { Card } from '../components/dashboard/DashCard';
import { TextReveal } from '../components/dashboard/DashCard';
import { useDash } from '../context/DashboardContext';
import DrugInteractionChecker from '../components/DrugInteractionChecker';
import { useAccessibility } from '../context/AccessibilityContext';
import { API_URL } from '../lib/api';

function MedicationPage() {
  const navigate = useNavigate();
  const { user, meds, takeMed, addMed, removeMed, fetchMedications } = useDash();
  const { speak } = useAccessibility();
  
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // File Upload State
  const scanInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [errorPattern, setErrorPattern] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [extractedMeds, setExtractedMeds] = useState([]);

  const filtered = meds.filter(m => {
    if (filter === 'pending') return !m.taken;
    if (filter === 'taken') return m.taken;
    return true;
  });

  const spoken = useRef(false);
  useEffect(() => {
     if (!spoken.current) {
       speak("Medication Schedule. Upload or review your prescriptions.", false);
       spoken.current = true;
     }
  }, [speak]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorPattern(null);

    speak('Processing prescription with AI. Please wait.', false);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user?.id || 'demo-user');

      const response = await fetch(`${API_URL}/api/prescription/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setInteractions(data.interactions || []);
      setExtractedMeds(data.medications || []);
      
      if (data.hasHighSeverity) {
        const highInt = (data.interactions || []).find(i => i.severity === 'HIGH');
        const warningText = `Warning, dangerous drug interaction detected between your medications ${highInt?.drug1} and ${highInt?.drug2}, please call your doctor immediately.`;
        speak(warningText, true); // Keep forced for HIGH interactions
      } else {
        speak(`Prescription processed successfully. Found ${data.medications?.length || 0} medications.`, false);
      }
      
      // Update global context DB state
      await fetchMedications();

    } catch (err) {
      console.error(err);
      setErrorPattern('Failed to process prescription. Please try again.');
      speak('Failed to process prescription.', false);
    } finally {
      setUploading(false);
      if (scanInputRef.current) scanInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  return (
    <div className="screen">
      <div className="row between" style={{ marginBottom: 'var(--s-8)', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--s-4)' }}>
        <div>
          <div className="t-micro" style={{ marginBottom: 10, color: 'var(--text-3)' }}>Your regimen</div>
          <h1 className="t-display" style={{ margin: 0 }}>
            <TextReveal text="My " /><span className="serif-accent" style={{ color: 'var(--accent)' }}><TextReveal text="schedule" /></span>
          </h1>
          <p className="t-body" style={{ margin: '10px 0 0', maxWidth: 560 }}>
            Manage your daily dose plan. AI auto-builds it from prescriptions you scan.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={16}/> Add medication
        </button>
      </div>

      {/* Prescription AI card & Interaction Results */}
      <div style={{ marginBottom: 'var(--s-6)' }}>
        <input ref={scanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        
        {errorPattern && (
          <div style={{ padding: 16, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 12, fontWeight: 600, marginBottom: 16, display: 'flex', gap: 8 }}>
            <Icon name="alert" size={18}/> {errorPattern}
          </div>
        )}

        <Card strong style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(100% 100% at 0% 0%, var(--accent-soft), transparent 60%)' }}/>
          <div style={{ position: 'relative', padding: 'var(--s-6)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 'var(--s-5)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px -8px var(--accent-glow)' }}>
              {uploading ? <Icon name="refresh" size={22} className="animate-spin"/> : <Icon name="sparkles" size={22}/>}
            </div>
            <div>
              <div className="t-h3" style={{ marginBottom: 2 }}>{uploading ? 'Analyzing Prescription...' : 'Prescription OCR'}</div>
              <div className="t-small">{uploading ? 'Extracting medications via Gemini Vision...' : "Scan a paper prescription or upload a photo — we'll build the schedule instantly."}</div>
            </div>
            <div className="row gap-2">
              <button disabled={uploading} className="btn btn-accent" onClick={() => scanInputRef.current?.click()}>
                <Icon name="camera" size={15}/> Scan Photo
              </button>
              <button disabled={uploading} className="btn btn-ghost" onClick={() => uploadInputRef.current?.click()}>
                <Icon name="upload" size={15}/> Upload
              </button>
            </div>
          </div>
        </Card>

        {extractedMeds.length > 0 && (
          <div className="glass-strong mt-6" style={{ padding: 'var(--s-6)', borderRadius: 'var(--radius-xl)' }}>
            <h3 className="t-h3" style={{ marginBottom: 'var(--s-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--success)' }}><Icon name="check" size={20} stroke={2.4}/></span>
              Extracted Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extractedMeds.map((med, idx) => (
                <div key={idx} className="glass" style={{ padding: 'var(--s-4)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="flex items-center gap-4 mb-3">
                    <div style={{ width: 44, height: 44, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 12, display: 'grid', placeItems: 'center' }}>
                      <Icon name="pill" size={20}/>
                    </div>
                    <div>
                      <h4 className="t-h4" style={{ margin: 0, lineHeight: 1.2 }}>{med.name}</h4>
                      <span className="t-micro" style={{ color: 'var(--accent)' }}>{med.dosage}</span>
                    </div>
                  </div>
                  <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                    <span className="chip"><Icon name="schedule" size={12}/> {med.times?.join(', ') || 'Auto'}</span>
                    <span className="chip"><Icon name="refresh" size={12}/> {med.frequency || 'Daily'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DrugInteractionChecker interactions={interactions} />
      </div>

      {/* Filter */}
      <div className="row between" style={{ marginBottom: 'var(--s-4)' }}>
        <div className="row gap-1" style={{ padding: 4, background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 999 }}>
          {[['all','All',meds.length],['pending','Pending',meds.filter(m=>!m.taken).length],['taken','Taken',meds.filter(m=>m.taken).length]].map(([id,label,n]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: '7px 14px', fontSize: 13, fontWeight: 500, borderRadius: 999,
              background: filter === id ? 'var(--surface-solid)' : 'transparent',
              color: filter === id ? 'var(--text)' : 'var(--text-3)',
              boxShadow: filter === id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 200ms',
            }}>
              {label} <span style={{ color: 'var(--text-4)', marginLeft: 4 }}>{n}</span>
            </button>
          ))}
        </div>
        <div className="t-small">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 'var(--s-12)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px', background: 'var(--surface-sunken)', color: 'var(--text-3)', display: 'grid', placeItems: 'center' }}>
            <Icon name="pill" size={26}/>
          </div>
          <div className="t-h3" style={{ marginBottom: 6 }}>
            {filter === 'taken' ? 'Nothing taken yet today' : filter === 'pending' ? 'All doses complete' : 'No medications scheduled yet'}
          </div>
          <div className="t-small" style={{ marginBottom: 16 }}>
            {filter === 'all' && 'Add some through the portal or scan a prescription.'}
            {filter === 'pending' && "You're all caught up. Nice work."}
            {filter === 'taken' && "As you mark doses, they'll show up here."}
          </div>
          {filter === 'all' && <button className="btn btn-accent" onClick={() => setShowAdd(true)}><Icon name="plus" size={14}/> Add medication</button>}
        </Card>
      ) : (
        <div className="col gap-3">
          {filtered.map(m => <MedRow key={m.id} med={m} onTake={() => takeMed(m.id)} onRemove={() => removeMed(m.id)}/>)}
        </div>
      )}

      {showAdd && <AddMedDialog onClose={() => setShowAdd(false)} onAdd={(m) => { addMed(m); setShowAdd(false); }}/>}
    </div>
  );
}

const MedRow = ({ med, onTake, onRemove }) => (
  <div className="glass" style={{
    display: 'grid', gridTemplateColumns: '60px 1fr auto',
    alignItems: 'center', gap: 'var(--s-4)',
    padding: 'var(--s-4) var(--s-5)', borderRadius: 'var(--radius-md)',
    opacity: med.taken ? 0.65 : 1, transition: 'opacity 300ms',
  }}>
    <div style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
      <div className="t-mono" style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1 }}>{med.time.split(' ')[1]}</div>
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 3 }}>{med.time.split(' ')[0]}</div>
    </div>
    <div style={{ minWidth: 0 }}>
      <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 600, textDecoration: med.taken ? 'line-through' : 'none', textDecorationColor: 'var(--text-3)' }}>
          {med.name} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>{med.strength}</span>
        </span>
        <span className="chip" style={{ fontSize: 11 }}><Icon name="fork" size={11}/> {med.meal}</span>
      </div>
      <div className="t-small">{med.instruction}</div>
    </div>
    <div className="row gap-2">
      {med.taken ? (
        <div className="chip" style={{ color: 'var(--success)', background: 'rgba(48,164,108,0.10)', borderColor: 'transparent' }}>
          <Icon name="check" size={12} stroke={2.4}/> Taken
        </div>
      ) : (
        <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: 13 }} onClick={onTake}>
          <Icon name="check" size={14} stroke={2.2}/> Take
        </button>
      )}
      <button className="btn-icon" onClick={onRemove} aria-label="Remove" style={{ width: 32, height: 32 }}>
        <Icon name="close" size={14}/>
      </button>
    </div>
  </div>
);

const inputStyle = {
  padding: '11px 14px', background: 'var(--surface-sunken)',
  border: '1px solid var(--border)', borderRadius: 10,
  fontSize: 14, color: 'var(--text)', outline: 'none',
  width: '100%', transition: 'border-color 150ms, background 150ms',
  fontFamily: 'inherit',
};

const Field = ({ label, children, style }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    <span className="t-micro" style={{ fontSize: 10 }}>{label}</span>
    {children}
  </label>
);

const AddMedDialog = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', strength: '', time: '', meal: 'After meal', kind: 'Tablet', instruction: 'Take with water' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name && form.strength && form.time;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'grid', placeItems: 'center', padding: 20,
      animation: 'fadeIn 200ms',
    }} onClick={onClose}>
      <div className="glass-strong" style={{ width: '100%', maxWidth: 480, padding: 'var(--s-6)', animation: 'slideUp 280ms cubic-bezier(.22,1,.36,1)' }} onClick={e => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 'var(--s-5)' }}>
          <div>
            <div className="t-micro" style={{ color: 'var(--accent)', marginBottom: 4 }}>New entry</div>
            <h3 className="t-h2" style={{ margin: 0 }}>Add medication</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><Icon name="close" size={16}/></button>
        </div>
        <div className="col gap-3" style={{ marginBottom: 'var(--s-5)' }}>
          <div className="row gap-3">
            <Field label="Name" style={{ flex: 2 }}><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Lisinopril" style={inputStyle}/></Field>
            <Field label="Strength" style={{ flex: 1 }}><input value={form.strength} onChange={e => set('strength', e.target.value)} placeholder="10mg" style={inputStyle}/></Field>
          </div>
          <Field label="Time"><input value={form.time} onChange={e => set('time', e.target.value)} placeholder="08:00 AM" style={inputStyle}/></Field>
          <div className="row gap-3">
            <Field label="Meal" style={{ flex: 1 }}>
              <select value={form.meal} onChange={e => set('meal', e.target.value)} style={inputStyle}>
                <option>Before meal</option><option>With meal</option><option>After meal</option><option>Empty stomach</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" disabled={!valid} style={{ opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
            onClick={() => valid && onAdd({ ...form, id: Date.now(), taken: false, dose: 1, totalDoses: 3, etaMin: 45 })}>
            Add to schedule
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

export default MedicationPage;
