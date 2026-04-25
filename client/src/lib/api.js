// ============================================
// Central API URL Configuration
// ============================================
// In development: empty string → Vite proxy forwards /api/* to localhost:3001
// In production:  set VITE_API_URL=https://your-backend.railway.app on Vercel/Netlify

export const API_URL = import.meta.env.VITE_API_URL || '';
