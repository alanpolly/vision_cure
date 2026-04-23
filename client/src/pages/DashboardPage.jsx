import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import DrugInteractionChecker from '../components/DrugInteractionChecker';

const NURSE_PHONE = '6207095007';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, getUserName } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMed, setReminderMed] = useState('Metformin 500mg');
  
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const nextMinStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const [reminderTime, setReminderTime] = useState(nextMinStr);
  const [reminderStatus, setReminderStatus] = useState(null); 
  const [reminderMsg, setReminderMsg] = useState('');
  const [inAppAlert, setInAppAlert] = useState(null);
  const [timelineMeds, setTimelineMeds] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const { speak, voiceGuidance } = useAccessibility();

  React.useEffect(() => {
    fetch(`/api/prescription/schedule?userId=${user?.id || 'demo-user'}`)
      .then(res => res.json())
      .then(data => setTimelineMeds(data.medications || []))
      .catch(console.error);
  }, [user]);

  React.useEffect(() => {
    const handleAlert = (e) => setInAppAlert(e.detail);
    window.addEventListener('visioncure_alert', handleAlert);
    return () => window.removeEventListener('visioncure_alert', handleAlert);
  }, []);

  const DEFAULT_REMINDERS = [
    { medication: 'Amlodipine 5mg', time: '08:00', fired: false },
    { medication: 'Metformin 500mg', time: '13:00', fired: false },
    { medication: 'Warfarin 2mg', time: '20:00', fired: false }
  ];

  React.useEffect(() => {
    if (window.demoReminderInterval) {
      clearInterval(window.demoReminderInterval);
      window.demoReminderInterval = null;
    }

    let stored = localStorage.getItem('visioncure_demo_reminder');
    if (!stored || !stored.startsWith('[')) {
      localStorage.setItem('visioncure_demo_reminder', JSON.stringify(DEFAULT_REMINDERS));
    }

    const intervalId = setInterval(() => {
      try {
        const raw = localStorage.getItem('visioncure_demo_reminder');
        if (raw && raw.startsWith('[')) {
          const reminders = JSON.parse(raw);
          let updated = false;

          for (let i = 0; i < reminders.length; i++) {
            const rem = reminders[i];
            if (!rem.fired) {
              const checkNow = new Date();
              const nowStr = `${checkNow.getHours().toString().padStart(2, '0')}:${checkNow.getMinutes().toString().padStart(2, '0')}`;
              if (nowStr === rem.time) {
                try {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`💊 Time to take ${rem.medication}`, {
                      body: `It's time for your dose of ${rem.medication}.`,
                      icon: 'https://cdn-icons-png.flaticon.com/512/3022/3022874.png'
                    });
                  }
                } catch (e) {}
                
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
                audio.play().catch(e => {});
                
                window.dispatchEvent(new CustomEvent('visioncure_alert', { detail: rem }));
                rem.fired = true;
                updated = true;
              }
            }
          }
          if (updated) localStorage.setItem('visioncure_demo_reminder', JSON.stringify(reminders));
        }
      } catch(e) {}
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSetReminder = async () => {
    setReminderStatus('loading');
    try {
      if ('Notification' in window) await Notification.requestPermission();
      let stored = localStorage.getItem('visioncure_demo_reminder');
      let reminders = (stored && stored.startsWith('[')) ? JSON.parse(stored) : DEFAULT_REMINDERS;
      reminders.push({ medication: reminderMed, time: reminderTime, fired: false });
      localStorage.setItem('visioncure_demo_reminder', JSON.stringify(reminders));
      setReminderStatus('success');
      setReminderMsg('Reminder set!');
    } catch (err) {
      setReminderStatus('error');
      setReminderMsg('Failed to set reminder.');
    }
  };

  const handleCheckInteractions = async () => {
    setCheckingInteractions(true);
    if (voiceGuidance) speak('Checking for drug interactions. One moment.');
    try {
      const res = await fetch('/api/check-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'demo-user' }),
      });
      const data = await res.json();
      setInteractions(data.interactions || []);
      
      if (data.interactions && data.interactions.some(i => i.severity === 'HIGH')) {
        const highInt = data.interactions.find(i => i.severity === 'HIGH');
        const warningText = `Warning, dangerous drug interaction detected between your medications ${highInt.drug1} and ${highInt.drug2}, please call your doctor immediately.`;
        speak(warningText, true);
        
        // ElevenLabs speak
        try {
          fetch('/api/voice/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: warningText })
          }).then(res => res.blob()).then(blob => {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
          });
        } catch(e) {}
      } else if (voiceGuidance) {
        speak('No dangerous interactions found. Your medications are safe.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <section className="px-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">
          {greeting}, <span className="vc-gradient-text">{getUserName()}</span>.
        </h1>
        <p className="text-lg text-slate-500 font-medium">Your health companion is ready for you today.</p>
      </section>

      {/* Main Priority Card (Bento Focus) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
             <span className="material-symbols-outlined text-[10rem]">medication</span>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="space-y-4">
              <span className="inline-flex px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[0.7rem] font-black tracking-[0.2em] uppercase">NEXT DOSE IN 15 MIN</span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">Metformin 500mg</h2>
              <div className="flex flex-wrap gap-5 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/10 rounded-2xl">
                   <span className="material-symbols-outlined">schedule</span>
                   <span className="font-bold">01:00 PM</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-black/10 rounded-2xl">
                   <span className="material-symbols-outlined">restaurant</span>
                   <span className="font-bold">After Lunch</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/scan')} 
              className="mt-4 bg-white text-indigo-600 px-8 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
              Start AI Scan
            </button>
          </div>
        </div>

        {/* Small Status Bento Grid */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-6">
          <div className="vc-glass p-6 rounded-[2rem] flex flex-col justify-center items-center text-center space-y-2 border border-blue-50">
             <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
             </div>
             <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Progress</span>
             <span className="text-3xl font-black text-slate-800 tracking-tighter">2 of 3</span>
          </div>
          <div className="vc-glass p-6 rounded-[2rem] flex flex-col justify-center items-center text-center space-y-2 border border-emerald-50">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
             </div>
             <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Safety</span>
             <span className="text-3xl font-black text-emerald-600 tracking-tighter">Verified</span>
          </div>
        </div>
      </section>

      {/* Safety Alert (Refined) */}
      <section className="bg-red-50/50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-5">
        <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
           <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <div className="space-y-0.5">
          <h3 className="text-lg font-black text-red-800">Drug Interaction Alert</h3>
          <p className="text-red-700/80 font-medium">Do not take <strong>Aspirin</strong> with <strong>Warfarin</strong> today.</p>
        </div>
      </section>

      {/* Quick Actions (Circular Minimalist) */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2 uppercase tracking-widest text-[0.8rem]">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => navigate('/scan')} className="vc-glass p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:border-indigo-200 hover:-translate-y-1 transition-all">
             <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-indigo-50">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
             </div>
             <span className="font-bold text-sm text-slate-700">Scan</span>
          </button>
          <button onClick={() => navigate('/medications')} className="vc-glass p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:border-indigo-200 hover:-translate-y-1 transition-all">
             <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">calendar_month</span>
             </div>
             <span className="font-bold text-sm text-slate-700">Schedule</span>
          </button>
          <button onClick={() => setShowReminder(true)} className="vc-glass p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:border-indigo-200 hover:-translate-y-1 transition-all">
             <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">alarm_add</span>
             </div>
             <span className="font-bold text-sm text-slate-700">Reminder</span>
          </button>
          <button onClick={handleCheckInteractions} disabled={checkingInteractions} className="vc-glass p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:border-indigo-200 hover:-translate-y-1 transition-all">
             <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                {checkingInteractions ? (
                  <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                )}
             </div>
             <span className="font-bold text-sm text-slate-700">Check Meds</span>
          </button>
          <a href={`tel:${NURSE_PHONE}`} className="vc-glass p-6 rounded-[2rem] flex flex-col items-center gap-3 bg-red-50/20 border-red-100 hover:bg-red-50 hover:-translate-y-1 transition-all no-underline">
             <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">call</span>
             </div>
             <span className="font-bold text-sm text-red-600">Nurse</span>
          </a>
        </div>
      </section>

      {/* Interactions Report Section */}
      {interactions.length > 0 && (
        <section className="animate-in fade-in zoom-in-95 duration-500">
           <DrugInteractionChecker interactions={interactions} />
           <div className="flex justify-center mt-6">
              <button onClick={() => setInteractions([])} className="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]">Dismiss Report</button>
           </div>
        </section>
      )}

      {/* Item List (Timeline Preview) */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest text-[0.8rem]">Today's Plan</h3>
          <button onClick={() => navigate('/medications')} className="text-indigo-600 font-bold text-sm">View Timeline</button>
        </div>
        <div className="space-y-4">
           {timelineMeds.length === 0 ? (
             <div className="p-6 bg-white rounded-[2.2rem] text-center text-slate-500 font-medium">No medications scheduled yet.</div>
           ) : timelineMeds.slice(0, 3).map((med, idx) => (
             <div key={idx} className="flex items-center gap-5 p-6 bg-white rounded-[2.2rem] shadow-md shadow-indigo-50 border border-indigo-100 scale-[1.02]">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                   <span className="material-symbols-outlined text-2xl">pill</span>
                </div>
                <div className="flex-1">
                   <h4 className="text-lg font-black text-slate-800">{med.medication_name} {med.dosage}</h4>
                   <p className="text-sm font-medium text-indigo-400">Next dose at {med.times && med.times.length > 0 ? med.times[0] : 'Anytime'}</p>
                </div>
                <div className="px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-black rounded-full uppercase shadow-sm">Upcoming</div>
             </div>
           ))}
        </div>
      </section>

      {/* Reminder Modal */}
      {showReminder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowReminder(false)}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 flex flex-col space-y-6 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
               <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[40px]">alarm_add</span>
               </div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">Set Reminder</h2>
               <p className="text-slate-500 font-medium">Schedule a demo alert.</p>
            </div>
            {reminderStatus === 'success' ? (
              <div className="text-center py-4 space-y-4">
                 <p className="text-emerald-600 font-bold">{reminderMsg}</p>
                 <button onClick={() => setShowReminder(false)} className="w-full py-4 bg-slate-100 text-slate-800 rounded-2xl font-black">Close</button>
              </div>
            ) : (
              <div className="space-y-4">
                <select value={reminderMed} onChange={e => setReminderMed(e.target.value)} className="w-full h-14 bg-slate-50 rounded-2xl px-5 text-slate-800 font-bold border-none focus:ring-2 focus:ring-indigo-100">
                  <option>Metformin 500mg</option>
                  <option>Amlodipine 5mg</option>
                  <option>Warfarin 2mg</option>
                </select>
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className="w-full h-14 bg-slate-50 rounded-2xl px-5 text-slate-800 font-bold border-none focus:ring-2 focus:ring-indigo-100" />
                <button onClick={handleSetReminder} className="w-full py-4 bg-indigo-600 text-white rounded-full font-black text-lg shadow-lg shadow-indigo-100">Confirm Reminder</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Alert Popup */}
      {inAppAlert && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-red-900/60 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl shadow-red-500/20">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <span className="material-symbols-outlined text-[64px]">notifications_active</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">Time to take!</h2>
            <p className="text-xl text-slate-500 font-medium mb-8 leading-tight">
              Please take <strong className="text-red-500">{inAppAlert.medication}</strong> now.
            </p>
            <div className="w-full space-y-4">
              <button onClick={() => setInAppAlert(null)} className="w-full py-5 bg-emerald-500 text-white rounded-full font-black text-xl shadow-lg">Done</button>
              <button onClick={() => setInAppAlert(null)} className="w-full py-4 text-slate-400 font-bold">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
