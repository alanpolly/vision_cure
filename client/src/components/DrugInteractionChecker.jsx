import React from 'react';

/**
 * DrugInteractionChecker Component
 * Displays a list of drug interactions with color-coded severity cards.
 * Shows a DANGER banner if high severity interactions exist.
 */
function DrugInteractionChecker({ interactions = [] }) {
  if (!interactions || interactions.length === 0) return null;

  const highSeverityCount = interactions.filter(i => i.severity === 'HIGH').length;

  const handleCallNurse = () => {
    // SOS trigger function from useVoiceAssistant.js context
    window.location.href = 'tel:6207095007';
  };

  return (
    <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HIGH SEVERITY DANGER BANNER */}
      {highSeverityCount > 0 && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-red-600 text-white p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">DANGER — CALL YOUR DOCTOR NOW</h2>
              <p className="text-white/80 font-bold text-lg">We detected {highSeverityCount} high-risk interaction(s) in your medications.</p>
            </div>
          </div>
          <button 
            onClick={handleCallNurse}
            className="bg-white text-red-600 px-10 py-4 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-2xl">call</span>
            EMERGENCY SOS
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">medical_information</span>
        </div>
        <h3 className="text-2xl font-black text-slate-800">Clinical Safety Report</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interactions.map((interaction, idx) => {
          const isHigh = interaction.severity === 'HIGH';
          const isMedium = interaction.severity === 'MEDIUM';
          
          let cardClasses = "vc-glass p-6 rounded-[2.5rem] border-2 shadow-lg transition-all hover:-translate-y-1 ";
          let iconColor = "";
          let badgeText = "";
          let badgeClasses = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 inline-block ";

          if (isHigh) {
            cardClasses += "border-red-200 bg-red-50/40 shadow-red-100";
            iconColor = "text-red-500";
            badgeText = "CRITICAL RISK";
            badgeClasses += "bg-red-500 text-white animate-pulse";
          } else if (isMedium) {
            cardClasses += "border-amber-200 bg-amber-50/40 shadow-amber-100";
            iconColor = "text-amber-500";
            badgeText = "MODERATE RISK";
            badgeClasses += "bg-amber-500 text-white";
          } else {
            cardClasses += "border-slate-200 bg-slate-50/40 shadow-slate-100";
            iconColor = "text-slate-500";
            badgeText = "LOW RISK";
            badgeClasses += "bg-slate-500 text-white";
          }

          return (
            <div key={idx} className={cardClasses}>
              <div className={badgeClasses}>{badgeText}</div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`text-sm font-black text-slate-700 bg-white/80 px-4 py-2 rounded-2xl border border-white/50 shadow-sm flex items-center gap-2`}>
                   <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                   {interaction.drug1}
                </div>
                <span className="material-symbols-outlined text-slate-300 text-sm">add</span>
                <div className={`text-sm font-black text-slate-700 bg-white/80 px-4 py-2 rounded-2xl border border-white/50 shadow-sm flex items-center gap-2`}>
                   <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                   {interaction.drug2}
                </div>
              </div>

              <p className="text-slate-700 font-bold mb-4 leading-relaxed italic">
                "{interaction.description}"
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-white/60 border border-white/40">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommended Action</p>
                <p className={`font-black text-sm ${isHigh ? 'text-red-600' : 'text-slate-700'}`}>
                  {interaction.action}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DrugInteractionChecker;
