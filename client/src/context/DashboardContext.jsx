import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { API_URL } from '../lib/api';

const DashboardContext = createContext(null);
export const useDash = () => useContext(DashboardContext);

// Initial empty state until backend loads
const seedAlerts = [];

export function DashboardProvider({ children }) {
  const { user, getUserName } = useAuth();
  const { theme, setTheme } = useTheme();

  const [meds, setMeds] = useState([]);
  const [alerts, setAlerts] = useState(seedAlerts);
  const [a11y, setA11y] = useState({ largeText: false, highContrast: false, voice: false, simple: false });
  const [loading, setLoading] = useState(true);
  const [notifiedDoses, setNotifiedDoses] = useState(new Set()); // Track notified meds to avoid spam

  const userName = getUserName();
  const firstName = userName.split(' ')[0] || 'User';

  const dashUser = useMemo(() => ({
    id: user?.id || 'demo-user',
    firstName,
    lastName: userName.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    patientId: 'VC-' + (user?.id?.slice(-4) || '0000').toUpperCase(),
  }), [user, firstName, userName]);

  useEffect(() => {
    document.documentElement.style.fontSize = a11y.largeText ? '18px' : '16px';
  }, [a11y.largeText]);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/prescription/schedule?userId=${user?.id || 'demo-user'}`);
      if (res.ok) {
        const data = await res.json();
        
        // Map backend schema (name, dosage, times[]) to our UI schema (name, strength, time, taken, etc)
        const uiMeds = (data.medications || []).flatMap((backendMed, index) => {
          const timesStrArray = backendMed.times && backendMed.times.length > 0 ? backendMed.times : ['08:00'];
          
          return timesStrArray.map((t24, tIdx) => {
            // Convert "14:30" to "02:30 PM"
            const [h, m] = t24.split(':');
            let hours = parseInt(h, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            const time12 = `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;

            // Calculate ETA Mins
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const targetMins = parseInt(h, 10) * 60 + parseInt(m || '0', 10);
            let etaMin = targetMins - currentMins;
            if (etaMin < 0) etaMin += 1440; // Next day
            
            return {
              id: backendMed.id || backendMed._id || `m_${index}_${tIdx}`,
              name: backendMed.name || backendMed.medication_name,
              strength: backendMed.dosage || 'Unknown',
              time: time12,
              time24: t24,
              meal: backendMed.frequency || 'Routine',
              kind: 'Tablet', 
              instruction: backendMed.duration || 'Take as directed',
              taken: backendMed.status === 'taken',
              dose: tIdx + 1,
              totalDoses: timesStrArray.length,
              etaMin: etaMin
            };
          });
        });
        
        setMeds(uiMeds.sort((a, b) => a.etaMin - b.etaMin));
      }
    } catch (err) {
      console.error('Error fetching meds from backend:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for due medications every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      meds.forEach(med => {
        const notifKey = `${med.id}_${currentHHMM}`;
        
        // If it's time, not already taken, and we haven't notified for this specific minute
        if (med.time24 === currentHHMM && !med.taken && !notifiedDoses.has(notifKey)) {
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('VisionCure Reminder 💊', {
              body: `It is time to take your ${med.name} ${med.strength}!`,
              icon: '/vite.svg', // Assuming default vite icon, replace with actual logo if needed
              vibrate: [200, 100, 200, 100, 200]
            });
          }
          
          // Mark as notified in state
          setNotifiedDoses(prev => new Set(prev).add(notifKey));
        }
      });
    };

    const intervalId = setInterval(checkReminders, 60000);
    // Initial check
    checkReminders();

    return () => clearInterval(intervalId);
  }, [meds, notifiedDoses]);

  const takeMed = async (id) => {
    // Optimistic UI updates
    setMeds(ms => ms.map(m => m.id === id ? { ...m, taken: true } : m));
    // Could eventually hit /api/history to log the exact time taken
  };

  const removeMed = (id) => setMeds(ms => ms.filter(m => m.id !== id));
  
  const addMed = (m) => setMeds(ms => [...ms, m].sort((a, b) => a.time.localeCompare(b.time)));
  
  const addScanResult = (r) => {
      // In a real flow, this would POST to /api/schedule
      setMeds(ms => [...ms, {
        id: Date.now(), name: r.name, strength: r.strength || r.dosage,
        time: '06:00 PM', meal: 'Routine', kind: 'Tablet',
        instruction: 'Added from scanner', taken: true, dose: 1, totalDoses: 1, etaMin: 0,
      }]);
  };
  
  const dismissAlert = (id) => setAlerts(a => a.filter(x => x.id !== id));
  
  const updateUser = () => {}; 

  const ctx = {
    user: dashUser, updateUser,
    meds, loading, fetchMedications, takeMed, removeMed, addMed, addScanResult,
    alerts, setAlerts, dismissAlert,
    a11y, setA11y,
    theme, setTheme,
  };

  return <DashboardContext.Provider value={ctx}>{children}</DashboardContext.Provider>;
}
