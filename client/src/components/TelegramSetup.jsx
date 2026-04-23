import React, { useState, useEffect } from 'react';

/**
 * TelegramSetup Component
 * Allows users to link their Telegram ID to receive medication reminders.
 */
function TelegramSetup({ userId }) {
  const [telegramId, setTelegramId] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' or 'error'
  const [existingProfile, setExistingProfile] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/user/profile/${userId}`);
      const data = await res.json();
      if (data.profile) {
        setExistingProfile(data.profile);
        setTelegramId(data.profile.telegram_id || '');
        setCaregiverPhone(data.profile.caregiver_phone || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, telegramId, caregiverPhone }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vc-glass p-8 rounded-[3rem] border border-white/40 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <span className="material-symbols-outlined text-3xl">send</span>
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Telegram Reminders</h2>
          <p className="text-slate-500 font-bold">Get medication alerts on your phone</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
          <h3 className="font-black text-blue-700 uppercase tracking-widest text-xs mb-3">How to Setup</h3>
          <ol className="text-blue-900/80 font-bold text-lg space-y-2 list-decimal list-inside leading-snug">
            <li>Open Telegram on your phone</li>
            <li>Search for <span className="text-blue-600">@userinfobot</span></li>
            <li>Send any message to the bot</li>
            <li>Copy the <span className="text-blue-600">ID number</span> and paste it below</li>
          </ol>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Your Telegram ID</label>
            <input 
              type="text"
              placeholder="e.g. 123456789"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="w-full bg-white/60 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-[1.5rem] px-8 py-5 text-2xl font-black text-slate-800 transition-all placeholder:text-slate-300 outline-none shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Caregiver Phone (for SOS)</label>
            <input 
              type="tel"
              placeholder="e.g. +1 620-709-5007"
              value={caregiverPhone}
              onChange={(e) => setCaregiverPhone(e.target.value)}
              className="w-full bg-white/60 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-[1.5rem] px-8 py-5 text-2xl font-black text-slate-800 transition-all placeholder:text-slate-300 outline-none shadow-inner"
            />
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="bg-green-500 text-white p-6 rounded-[2rem] flex items-center gap-4 animate-in zoom-in duration-300">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
            <p className="font-black text-xl">Telegram reminders activated! You will now receive medication alerts.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500 text-white p-6 rounded-[2rem] flex items-center gap-4 animate-in shake duration-300">
            <span className="material-symbols-outlined text-3xl">error</span>
            <p className="font-black text-xl">Something went wrong. Please try again.</p>
          </div>
        )}

        {/* Save Button */}
        <button 
          onClick={handleSave}
          disabled={loading || !telegramId}
          className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <span className="material-symbols-outlined text-3xl">save</span>
              SAVE TELEGRAM SETTINGS
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default TelegramSetup;
