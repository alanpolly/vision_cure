import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import DrugInteractionChecker from './DrugInteractionChecker';
import { API_URL } from '../lib/api';

function PrescriptionUpload({ onUploadComplete }) {
  const { user } = useAuth();
  const { speak, voiceGuidance } = useAccessibility();
  const scanInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [extractedMeds, setExtractedMeds] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [errorPattern, setErrorPattern] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorPattern(null);
    if (voiceGuidance) speak('Processing prescription. Please wait.');

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
      setExtractedMeds(data.medications || []);
      setInteractions(data.interactions || []);
      
      if (voiceGuidance) {
        if (data.hasHighSeverity) {
          // Trigger high severity voice warning using the ElevenLabs speak route
          const highInt = (data.interactions || []).find(i => i.severity === 'HIGH');
          const warningText = `Warning, dangerous drug interaction detected between your medications ${highInt?.drug1} and ${highInt?.drug2}, please call your doctor immediately.`;
          
          speak(warningText, true); // Use local speak as fallback
          
          // Also try the ElevenLabs route specifically for the premium voice
          try {
            fetch(`${API_URL}/api/voice/speak`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: warningText })
            }).then(res => res.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play();
              });
          } catch (e) { console.error('ElevenLabs warning failed', e); }
        } else {
          speak(`Prescription processed successfully. Found ${data.medications?.length || 0} medications.`);
        }
      }
      
      if (onUploadComplete) onUploadComplete(data.medications, data.interactions);
    } catch (err) {
      console.error(err);
      setErrorPattern('Failed to process prescription. Please try again.');
      if (voiceGuidance) speak('Failed to process prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="vc-glass p-8 rounded-[3rem] text-center shadow-xl border border-white/60">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Prescription AI</h2>
        <p className="text-slate-500 font-medium mb-8">Scan a live document or upload an image to build your schedule instantly.</p>
        
        {errorPattern && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {errorPattern}
          </div>
        )}

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6 animate-pulse">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-indigo-400 rounded-full animate-spin"></div>
              <span className="material-symbols-outlined text-4xl text-indigo-600 relative z-10">document_scanner</span>
            </div>
            <p className="text-xl font-black text-indigo-600 tracking-widest uppercase">AI ANALYZING...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              ref={scanInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleFileChange} 
            />
            <input 
              ref={uploadInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <button 
              onClick={() => scanInputRef.current?.click()} 
              className="vc-btn-primary h-20 text-xl font-black shadow-lg hover:-translate-y-1 transition-all"
            >
              <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              Scan Photo
            </button>

            <button 
              onClick={() => uploadInputRef.current?.click()} 
              className="vc-btn-secondary h-20 text-xl font-black shadow-lg hover:-translate-y-1 transition-all bg-white"
            >
              <span className="material-symbols-outlined text-3xl">upload_file</span>
              Upload Image
            </button>
          </div>
        )}
      </div>

      {extractedMeds.length > 0 && (
        <div className="vc-glass p-8 rounded-[3rem]">
          <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500">task_alt</span>
            Extracted Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extractedMeds.map((med, idx) => (
              <div key={idx} className="bg-white/60 p-6 rounded-[2rem] border border-white/50 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                     <span className="material-symbols-outlined text-2xl">science</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 leading-tight">{med.name}</h4>
                    <span className="text-indigo-500 font-bold max-w-full text-sm">{med.dosage}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {med.times && med.times.length > 0 ? med.times.join(', ') : 'No exact time'}
                  </div>
                  <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="material-symbols-outlined text-[14px]">repeat</span>
                    {med.frequency || 'N/A'}
                  </div>
                  <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="material-symbols-outlined text-[14px]">date_range</span>
                    {med.duration || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions Report Section */}
      {interactions.length > 0 && (
        <DrugInteractionChecker interactions={interactions} />
      )}
    </div>
  );
}

export default PrescriptionUpload;
