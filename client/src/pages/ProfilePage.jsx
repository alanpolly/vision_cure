import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import TelegramSetup from '../components/TelegramSetup';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, getUserName, signOut, getToken, updateProfilePic } = useAuth();
  const {
    largeText, toggleLargeText,
    highContrast, toggleHighContrast,
    voiceGuidance, toggleVoiceGuidance,
    simpleMode, toggleSimpleMode,
    speak,
  } = useAccessibility();

  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/auth/profile-pic', {
        method: 'POST',
        headers: {
          'x-auth-token': getToken()
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        updateProfilePic(data.profilePicUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  const Toggle = ({ enabled, onToggle, label }) => (
    <button
      onClick={() => {
        onToggle();
        if (voiceGuidance) {
          setTimeout(() => speak(`${label} ${enabled ? 'disabled' : 'enabled'}`), 100);
        }
      }}
      className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${
        enabled ? 'bg-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-200'
      }`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <div
        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
          enabled ? 'translate-x-[24px]' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="px-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">My <span className="vc-gradient-text">Profile</span></h1>
        <p className="text-lg text-slate-500 font-medium tracking-tight mt-1">Manage your account and accessibility settings.</p>
      </header>

      {/* Profile Info */}
      <section className="vc-glass p-8 md:p-10 rounded-[2.5rem] border border-white/60 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div 
          className="relative w-32 h-32 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-full h-full rounded-[2.2rem] bg-indigo-50 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden rotate-3 transition-transform group-hover:scale-105 group-hover:rotate-6">
             {uploading ? (
               <span className="material-symbols-outlined text-indigo-400 text-4xl animate-spin">sync</span>
             ) : user?.profilePicUrl ? (
               <img src={'http://localhost:3001' + user.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <span className="material-symbols-outlined text-indigo-400 text-6xl">person</span>
             )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
             <span className="material-symbols-outlined text-sm">{user?.profilePicUrl ? 'edit' : 'add_a_photo'}</span>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </div>
        <div className="text-center md:text-left space-y-2 flex-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{getUserName()}</h2>
          <p className="text-slate-500 font-bold mb-4">{user?.email || 'user@example.com'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <button className="px-6 h-12 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                Edit Details
             </button>
             <button className="px-6 h-12 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all active:scale-95">
                Connected Devices
             </button>
          </div>
        </div>
      </section>
      
      {/* Telegram Reminders Setup */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest text-[0.8rem] px-2">Reminders</h3>
        <TelegramSetup userId={user?.id} />
      </section>

      {/* Accessibility Bento Grid */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest text-[0.8rem] px-2">Accessibility Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="vc-glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-100 transition-all">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                   <span className="material-symbols-outlined text-2xl">format_size</span>
                </div>
                <div>
                   <p className="font-black text-slate-800">Large Text</p>
                   <p className="text-sm font-medium text-slate-500">25% size boost</p>
                </div>
             </div>
             <Toggle enabled={largeText} onToggle={toggleLargeText} label="Large Text" />
          </div>

          <div className="vc-glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-100 transition-all">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                   <span className="material-symbols-outlined text-2xl">contrast</span>
                </div>
                <div>
                   <p className="font-black text-slate-800">High Contrast</p>
                   <p className="text-sm font-medium text-slate-500">Maximum visibility</p>
                </div>
             </div>
             <Toggle enabled={highContrast} onToggle={toggleHighContrast} label="High Contrast" />
          </div>

          <div className="vc-glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-100 transition-all">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                   <span className="material-symbols-outlined text-2xl">record_voice_over</span>
                </div>
                <div>
                   <p className="font-black text-slate-800">Voice Assist</p>
                   <p className="text-sm font-medium text-slate-500">AI audio guidance</p>
                </div>
             </div>
             <Toggle enabled={voiceGuidance} onToggle={toggleVoiceGuidance} label="Voice Adsist" />
          </div>

          <div className="vc-glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-100 transition-all">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                   <span className="material-symbols-outlined text-2xl">widgets</span>
                </div>
                <div>
                   <p className="font-black text-slate-800">Simple View</p>
                   <p className="text-sm font-medium text-slate-500">Maximum focus</p>
                </div>
             </div>
             <Toggle enabled={simpleMode} onToggle={toggleSimpleMode} label="Simple Mode" />
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest text-[0.8rem] px-2">Support & Safety</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                 <span className="material-symbols-outlined text-[6rem]">call</span>
              </div>
              <p className="text-indigo-100 font-bold tracking-widest uppercase text-xs">Primary Caregiver</p>
              <h4 className="text-2xl font-black tracking-tight">Abhinay Miller</h4>
              <p className="text-indigo-100/80 font-medium">Always available for emergency</p>
              <button 
                onClick={() => window.open('tel:6207095007', '_self')}
                className="w-full h-14 bg-white text-indigo-600 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all active:scale-95"
              >
                 Call Abhinay
              </button>
           </div>

           <div className="bg-red-50/50 border border-red-100 p-8 rounded-[2.5rem] flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                 <h4 className="text-2xl font-black text-red-700 tracking-tight">SOS Emergency</h4>
                 <p className="text-red-600 font-medium">Instant alert to healthcare center</p>
              </div>
              <button 
                onClick={() => {
                  window.open('tel:112', '_self');
                  window.open('sms:112?body=SOS! Medical Emergency. Need help.', '_self');
                }}
                className="w-full h-16 bg-red-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-red-200 animate-pulse hover:animate-none active:scale-95 transition-all"
              >
                 ACTIVATE SOS
              </button>
           </div>
        </div>
      </section>

      {/* Settings Footer */}
      <footer className="pt-10 pb-6 text-center space-y-6">
         <button 
           onClick={handleLogout}
           className="w-full h-16 border-2 border-red-500/20 text-red-500 rounded-full font-black text-lg hover:bg-red-50 transition-all active:scale-[0.98]"
         >
            Logout Securely
         </button>
         <div className="space-y-1">
            <p className="text-slate-400 font-bold text-sm">VisionCure Healthcare Companion</p>
            <p className="text-slate-300 font-medium text-xs tracking-widest">VERSION 2.4.1 • BUILD 890</p>
         </div>
      </footer>
    </div>
  );
}

export default ProfilePage;
