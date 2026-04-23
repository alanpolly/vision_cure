import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut } = useAuth();

  React.useEffect(() => {
    signOut();
  }, []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, fullName.trim());
        navigate('/dashboard');
      } else {
        await signIn(email.trim(), password);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vc-app-body min-h-screen flex flex-col items-center justify-center p-4">
      {/* Decorative blurred blobs */}
      <div className="vc-blob w-[500px] h-[500px] top-[-100px] left-[-100px]" style={{ background: 'radial-gradient(circle, #c7d2fe 0%, transparent 70%)' }}></div>
      <div className="vc-blob w-[400px] h-[400px] bottom-[-50px] right-[5%]" style={{ background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)' }}></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm mb-6 cursor-pointer"
            onClick={() => navigate('/')}
          >
             <div className="w-8 h-8 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-lg flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[1rem]">eye</span>
             </div>
             <span className="font-black text-lg tracking-tight vc-gradient-text uppercase">VisionCure</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            {isSignUp ? 'Join VisionCure' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {isSignUp ? 'Start your safe medication journey.' : 'Your personal health guardian awaits.'}
          </p>
        </div>

        <div className="vc-glass p-8 md:p-10 rounded-[2.5rem] border border-white/60 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-red-500 text-[1.2rem]">error</span>
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  className="w-full h-14 px-5 rounded-2xl bg-white/60 border border-white/40 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-800 placeholder:text-slate-300 outline-none"
                  placeholder="e.g. Martha Stewart"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                className="w-full h-14 px-5 rounded-2xl bg-white/60 border border-white/40 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-800 placeholder:text-slate-300 outline-none"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-black text-indigo-500 hover:text-indigo-700 uppercase"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                className="w-full h-14 px-5 rounded-2xl bg-white/60 border border-white/40 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-800 placeholder:text-slate-300 outline-none"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full h-14 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{isSignUp ? 'Create Account' : 'Log In'}</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/40 text-center">
            <p className="text-slate-500 font-medium">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="ml-2 text-indigo-600 font-bold hover:underline"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
           <Link to="/" className="text-slate-400 hover:text-slate-600 font-bold text-sm tracking-tight transition-colors">
              <span className="material-symbols-outlined text-[1rem] align-middle mr-1">arrow_back</span>
              Back to Home
           </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
