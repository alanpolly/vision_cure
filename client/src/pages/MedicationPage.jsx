import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PrescriptionUpload from '../components/PrescriptionUpload';

function MedicationPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMedications();
  }, [user]);

  const fetchMedications = async () => {
    try {
      const res = await fetch(`/api/prescription/schedule?userId=${user?.id || 'demo-user'}`);
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error('Error fetching meds:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      // Dummy toggle logic since we don't have a status column mapped in our new table yet
      fetchMedications();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="px-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">My <span className="vc-gradient-text">Schedule</span></h1>
        <p className="text-lg text-slate-500 font-medium tracking-tight">Manage your daily dose plan and tracking.</p>
      </header>

      <section className="space-y-6">
        <PrescriptionUpload onUploadComplete={() => fetchMedications()} />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <span className="material-symbols-outlined text-6xl text-slate-200">hourglass_top</span>
          </div>
        ) : medications.length === 0 ? (
          <div className="vc-glass p-12 rounded-[2.5rem] text-center space-y-4">
             <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">inbox</span>
             </div>
             <p className="text-xl font-bold text-slate-800">No medications scheduled yet.</p>
             <p className="text-slate-500 font-medium">Add some through the portal or scan a label.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med, idx) => (
              <div key={med.id || idx} className="vc-glass p-6 md:p-8 rounded-[2.5rem] border border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all group">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 bg-indigo-50 text-indigo-500`}>
                    <span className="material-symbols-outlined text-3xl">pill</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{med.medication_name} <span className="text-indigo-500">{med.dosage}</span></h3>
                    <div className="flex flex-wrap gap-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                       <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {med.times && med.times.length > 0 ? med.times.join(', ') : 'Daily'}
                       </div>
                       <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                          <span className="material-symbols-outlined text-sm">restaurant</span>
                          {med.frequency || 'Routine'}
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {med.status === 'pending' || !med.status ? (
                    <>
                      <button 
                        onClick={() => updateStatus(med.id, 'taken')} 
                        className="flex-1 md:flex-none h-14 px-8 bg-emerald-500 text-white rounded-2xl font-black shadow-md hover:bg-emerald-600 active:scale-95 transition-all outline-none"
                      >
                        Taken
                      </button>
                      <button 
                        onClick={() => updateStatus(med.id, 'missed')}
                        className="h-14 w-14 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all outline-none"
                      >
                         <span className="material-symbols-outlined">close</span>
                      </button>
                    </>
                  ) : (
                    <div className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-[.15em] ${
                      med.status === 'taken' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {med.status || 'pending'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Safety Info Section */}
      <section className="bg-indigo-600/5 p-8 md:p-10 rounded-[2.5rem] border border-indigo-100/50 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
         <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[1.8rem] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-4xl">shield_with_heart</span>
         </div>
         <div className="space-y-2 flex-1">
            <h3 className="text-2xl font-black text-slate-800">Your Safety is Priority</h3>
            <p className="text-lg text-slate-500 font-medium">Our AI monitors for drug interactions 24/7. Any suspicious mix will be flagged instantly in your dashboard.</p>
         </div>
         <button className="h-14 px-8 bg-white border border-indigo-100 rounded-2xl font-bold text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95">
            Safety Log
         </button>
      </section>
    </div>
  );
}

export default MedicationPage;
