import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

const API_URL = '';

const STATE_CONFIG = {
  TAKE_NOW: {
    color: '#10b981',
    bgClass: 'bg-emerald-50/80',
    ringClass: 'ring-emerald-500/30 shadow-emerald-100',
    icon: 'check_circle',
    iconColor: 'text-emerald-600',
    label: 'Verified — Safe to Take',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
  },
  CONTRAINDICATION: {
    color: '#ef4444',
    bgClass: 'bg-red-50/80',
    ringClass: 'ring-red-500/30 shadow-red-100',
    icon: 'warning',
    iconColor: 'text-red-600',
    label: 'Do Not Take',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
  },
  WARNING: {
    color: '#f59e0b',
    bgClass: 'bg-amber-50/80',
    ringClass: 'ring-amber-500/30 shadow-amber-100',
    icon: 'report',
    iconColor: 'text-amber-600',
    label: 'Safety Warning',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
  },
  NOT_SCHEDULED: {
    color: '#4f46e5',
    bgClass: 'bg-indigo-50/80',
    ringClass: 'ring-indigo-500/30 shadow-indigo-100',
    icon: 'schedule',
    iconColor: 'text-indigo-600',
    label: 'Not Scheduled Now',
    badgeBg: 'bg-indigo-500',
    badgeText: 'text-white',
  },
  UNKNOWN_DRUG: {
    color: '#64748b',
    bgClass: 'bg-slate-50/80',
    ringClass: 'ring-slate-500/30 shadow-slate-100',
    icon: 'help',
    iconColor: 'text-slate-600',
    label: 'Not Recognized',
    badgeBg: 'bg-slate-500',
    badgeText: 'text-white',
  },
  ERROR: {
    color: '#ef4444',
    bgClass: 'bg-red-50/80',
    ringClass: 'ring-red-500/30 shadow-red-100',
    icon: 'error',
    iconColor: 'text-red-600',
    label: 'Error — Try Again',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
  },
  NO_DETECTION: {
    color: '#4f46e5',
    bgClass: 'bg-indigo-50/40',
    ringClass: 'ring-indigo-500/20 shadow-indigo-50',
    icon: 'camera',
    iconColor: 'text-indigo-500',
    label: 'Preparing AI...',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
  },
};

function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { voiceGuidance, speak } = useAccessibility();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const isSwitchingCameraRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [arState, setArState] = useState('NO_DETECTION');
  const [autoScan, setAutoScan] = useState(false);
  const autoScanRef = useRef(null);
  const scanningRef = useRef(false);
  const hasResultRef = useRef(false);

  const [wrongMedicationAlert, setWrongMedicationAlert] = useState(false);
  const [actualDueMeds, setActualDueMeds] = useState([]);

  const fileInputRef = useRef(null);
  const userId = user?.id || 'demo-user';

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      });

      setCameraActive(true);
      if (voiceGuidance) speak('Camera active. Focus on the label.');
    } catch (err) {
      setCameraError('Please allow camera access in your settings.');
    }
  }, [facingMode, voiceGuidance, speak]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;

    const MAX_SIZE = 512;
    let w = video.videoWidth;
    let h = video.videoHeight;
    const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h, 1);
    w *= ratio; h *= ratio;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    return dataUrl.split(',')[1];
  }, []);

  const scanFrame = useCallback(async (base64Image) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, userId })
      });

      if (!response.ok) throw new Error('Network error');
      let data = await response.json();

      if (data.detectedDrug && data.detectedDrug.name) {
         try {
           const valRes = await fetch(`${API_URL}/api/prescription/validate-scan`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ scannedMedicine: data.detectedDrug.name, userId })
           });
           if (valRes.ok) {
             const valData = await valRes.json();
             if (valData.valid === false) {
               setWrongMedicationAlert(true);
               setActualDueMeds(valData.dueMedications || []);
               setScanning(false);
               scanningRef.current = false;
               if (voiceGuidance) speak('STOP. WRONG MEDICATION. Calling Nurse.');
               setTimeout(() => {
                 window.location.href = 'tel:6207095007';
               }, 2000);
               return; // Stop standard processing
             }
           }
         } catch (e) {
           console.error('Validate scan error:', e);
         }
      }

      setScanResult(data);
      setArState(data.arState || 'NO_DETECTION');

      if (data.arState && data.arState !== 'NO_DETECTION') {
        hasResultRef.current = true;
        setAutoScan(false);
      }
      if (voiceGuidance && data.message) speak(data.message);
    } catch (err) {
      setArState('ERROR');
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  }, [userId, voiceGuidance, speak]);

  const handleScanNow = useCallback(() => {
    const base64 = captureFrame();
    if (base64) scanFrame(base64);
  }, [captureFrame, scanFrame]);

  useEffect(() => {
    if (cameraActive && autoScan && !hasResultRef.current) {
      autoScanRef.current = setInterval(() => {
        if (!scanningRef.current) {
          const base64 = captureFrame();
          if (base64) scanFrame(base64);
        }
      }, 3000);
      return () => clearInterval(autoScanRef.current);
    }
  }, [cameraActive, autoScan, captureFrame, scanFrame]);

  // Handle autonomous scan triggering from Voice Assistant
  useEffect(() => {
    if (location.state?.autoStartScan && !cameraActive) {
      startCamera();
      setAutoScan(true);
      // Clean up state so we don't automatically scan again if the page re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location, cameraActive, startCamera]);

  const config = STATE_CONFIG[arState] || STATE_CONFIG.NO_DETECTION;

  return (
    <div className="vc-app-body min-h-screen px-4 md:px-8 space-y-8 pb-32">
      {/* Decorative blobs */}
      <div className="vc-blob w-[500px] h-[500px] top-[-100px] right-[-100px]" style={{ background: 'radial-gradient(circle, #c7d2fe 0%, transparent 70%)' }}></div>

      <header className="pt-8">
        <button 
          onClick={() => { stopCamera(); navigate('/dashboard'); }} 
          className="flex items-center gap-2 text-indigo-600 font-bold mb-4 hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Dashboard
        </button>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">AI Vision <span className="vc-gradient-text">Scanner</span></h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mt-2 tracking-tight">Point your camera at a medication bottle to verify safety and schedule.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Camera/Scanner View */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className={`relative aspect-video w-full rounded-[3rem] overflow-hidden bg-black ring-8 ${config.ringClass} transition-all duration-700`}>
            <video ref={videoRef} className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`} autoPlay playsInline muted />
            
            {!cameraActive && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/40 backdrop-blur-md gap-6">
                <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-5xl">photo_camera</span>
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-black text-2xl">Camera Ready</p>
                  <p className="text-slate-500 font-medium">Click "Start Scan" below</p>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {cameraActive && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-64 h-64 border-2 border-white/30 rounded-[3rem] relative">
                      <div className="absolute inset-0 rounded-[3rem] border-4 border-white/10 animate-pulse"></div>
                      {scanning && <div className="absolute top-0 left-0 w-full h-[4px] bg-indigo-400 blur-sm animate-scan-beam"></div>}
                   </div>
                </div>
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl vc-glass border border-white/50 flex items-center gap-3 shadow-2xl transition-all duration-500`}>
                   {scanning ? (
                      <span className="material-symbols-outlined animate-spin text-indigo-500">sync</span>
                   ) : (
                      <span className="material-symbols-outlined text-indigo-500">vision_check</span>
                   )}
                   <span className="font-black text-slate-800 tracking-tight">{scanning ? 'AI IS ANALYZING...' : config.label}</span>
                </div>
              </>
            )}
          </div>

          <div className={`grid grid-cols-1 ${!cameraActive ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
             {!cameraActive ? (
                <button onClick={startCamera} className="vc-btn-primary h-20 text-xl tracking-tight">
                   <span className="material-symbols-outlined text-3xl">camera</span>
                   Start Scanning
                </button>
             ) : (
                <>
                  <button onClick={handleScanNow} disabled={scanning} className="vc-btn-primary h-20 text-xl tracking-tight disabled:opacity-50">
                     <span className="material-symbols-outlined text-3xl">{scanning ? 'sync' : 'document_scanner'}</span>
                     {scanning ? 'Analyzing...' : 'Scan Now'}
                  </button>
                  <button onClick={stopCamera} className="h-20 text-xl tracking-tight bg-red-50 text-red-500 border-2 border-red-200 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-red-100 active:scale-95 transition-all">
                     <span className="material-symbols-outlined text-3xl">stop_circle</span>
                     Stop
                  </button>
                </>
             )}
             <button onClick={() => fileInputRef.current?.click()} className="vc-btn-secondary h-20 text-xl tracking-tight bg-white">
                <span className="material-symbols-outlined text-3xl">image</span>
                Upload Image
             </button>
             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => scanFrame(reader.result.split(',')[1]);
                  reader.readAsDataURL(file);
                }
             }} />
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="lg:col-span-12 xl:col-span-5">
           {scanResult && scanResult.detectedDrug ? (
              <div className={`vc-glass p-8 md:p-10 rounded-[3rem] border border-white/60 shadow-xl space-y-8 animate-in zoom-in-95 duration-500`}>
                 <div className="flex items-center justify-between">
                    <div className={`w-16 h-16 ${config.bgClass} rounded-2xl flex items-center justify-center`}>
                       <span className={`material-symbols-outlined ${config.iconColor} text-4xl`}>{config.icon}</span>
                    </div>
                    <div className={`px-5 py-2 ${config.badgeBg} ${config.badgeText} rounded-full font-black text-xs uppercase tracking-widest`}>
                       {arState}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-800 leading-tight">
                       {scanResult.detectedDrug.name} <span className="text-indigo-500">{scanResult.detectedDrug.dosage}</span>
                    </h2>
                    <p className="text-slate-500 font-bold text-lg">{scanResult.message}</p>
                 </div>

                 <div className={`${config.bgClass} p-8 rounded-[2rem] border border-white/50 text-center space-y-2 transition-colors`}>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Decision</span>
                    <p className={`text-4xl md:text-5xl font-black ${config.iconColor} tracking-tighter`}>
                       {arState === 'TAKE_NOW' ? 'SAFE TO TAKE' : 'STOP — WAIT'}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => speak(scanResult.message, true)} className="vc-btn-secondary h-16 py-0">
                       <span className="material-symbols-outlined">volume_up</span>
                    </button>
                    <button onClick={() => { setScanResult(null); setArState('NO_DETECTION'); hasResultRef.current = false; }} className="vc-btn-primary h-16 py-0 flex-1">
                       <span className="material-symbols-outlined">refresh</span>
                       Try Again
                    </button>
                 </div>
              </div>
           ) : (
              <div className="vc-glass p-12 rounded-[3rem] text-center space-y-6 opacity-80 border-dashed border-white/80">
                 <div className="w-24 h-24 bg-indigo-50/50 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[3rem]">psychiatry</span>
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">Advanced AI Intelligence</h3>
                    <p className="text-slate-500 font-medium">VisionCure analyzes your medication labels using Google Gemini Vision to ensure zero conflicts with your current health plan.</p>
                 </div>
              </div>
           )}
        </div>
      </main>

      {/* EMERGENCY WRONG MEDICATION ALERT */}
      {wrongMedicationAlert && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-red-900/95 backdrop-blur-xl animate-in zoom-in-95 duration-200">
           <div className="text-center flex flex-col items-center">
             <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center animate-ping absolute opacity-50"></div>
             <span className="material-symbols-outlined text-[120px] text-white relative z-10 animate-pulse">warning</span>
             
             <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mt-8 leading-tight">WRONG<br/>MEDICATION</h1>
             <p className="text-red-200 text-xl font-bold mt-4 uppercase tracking-[0.2em]">Calling Nurse Immediately...</p>
             
             {actualDueMeds.length > 0 && (
               <div className="mt-12 bg-black/40 p-8 rounded-[2rem] text-left max-w-md w-full border border-red-500/50 shadow-2xl overflow-y-auto max-h-64 vc-scrollbar">
                 <p className="text-red-200 font-black text-sm uppercase tracking-widest mb-4">Medications Due Now:</p>
                 <ul className="space-y-4 text-white">
                    {actualDueMeds.map((m, i) => (
                      <li key={i} className="flex flex-col gap-1 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                         <span className="font-bold text-xl">{m.medication_name}</span>
                         <span className="text-sm font-medium opacity-80">{m.dosage} • {m.times && m.times.join(', ')}</span>
                      </li>
                    ))}
                 </ul>
               </div>
             )}
             
             <button onClick={() => setWrongMedicationAlert(false)} className="mt-12 h-16 px-10 rounded-full bg-white text-red-600 font-black text-xl active:scale-95 transition-transform shadow-xl">
                Dismiss Alert
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default ScanPage;
