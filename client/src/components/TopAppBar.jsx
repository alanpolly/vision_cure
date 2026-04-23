import React from 'react';
import { useNavigate } from 'react-router-dom';

function TopAppBar() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 py-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-3 vc-glass rounded-[20px] border border-white/40 shadow-sm">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 border-radius-sm bg-gradient-to-135 from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[1.2rem]">eye</span>
          </div>
          <div className="text-xl font-black tracking-tight vc-gradient-text uppercase">
            VisionCure
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-white/50 hover:bg-white rounded-full transition-all active:scale-90 text-slate-500 hover:text-[#4f46e5]">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button 
            className="p-2.5 bg-white/50 hover:bg-white rounded-full transition-all active:scale-90 text-slate-500 hover:text-[#4f46e5] md:hidden"
            onClick={() => navigate('/profile')}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopAppBar;
