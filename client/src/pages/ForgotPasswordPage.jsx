import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';
import { FlickeringGrid } from '../components/ui/FlickeringGrid';

function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    // Mock API delay
    setTimeout(() => {
      setIsLoading(false);
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
      } else {
        setIsSuccess(true);
      }
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <FlickeringGrid />

      {/* Minimal Nav */}
      <nav className="absolute top-0 left-0 w-full px-6 md:px-10 py-6 flex items-center justify-between z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full dark:bg-white bg-black flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <span className="dark:text-black text-white font-bold text-sm outfit">V</span>
          </div>
          <span className="dark:text-white text-black font-bold text-lg tracking-tight uppercase outfit">
            Vision <span className="dark:text-white/25 text-black/25">Cure</span>
          </span>
        </Link>
        <ThemeSwitcher />
      </nav>

      {/* Auth Card */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[400px] px-6"
      >
        <div className="p-8 rounded-3xl dark:bg-white/[0.02] bg-black/[0.02] dark:border dark:border-white/[0.08] border border-black/[0.08] backdrop-blur-2xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold uppercase tracking-wide outfit mb-2 dark:text-white text-black">Reset Password</h2>
            <p className="dark:text-white/40 text-black/40 text-sm inter">
              {isSuccess
                ? 'Check your email for reset instructions.'
                : 'Enter your email to receive a reset link.'}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center inter">
                  {error}
                </motion.div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-wider dark:text-white/50 text-black/50 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-3.5 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.08] border-black/[0.08] dark:text-white text-black text-sm inter outline-none dark:focus:border-white/20 focus:border-black/20 transition-colors placeholder:dark:text-white/20 placeholder:text-black/30"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl dark:bg-white dark:text-black bg-black text-white text-sm font-bold uppercase tracking-wider outfit transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 dark:shadow-[0_4px_20px_rgba(255,255,255,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 rounded-full dark:bg-white/10 bg-black/5 flex items-center justify-center mb-6 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
              <Link to="/login" className="w-full py-3.5 rounded-xl border dark:border-white/15 border-black/15 dark:bg-white/[0.02] bg-black/[0.02] text-sm font-medium inter transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center dark:text-white/80 text-black/80 hover:dark:text-white hover:text-black hover:dark:border-white/30 hover:border-black/30">
                Back to Login
              </Link>
            </motion.div>
          )}

          {!isSuccess && (
            <p className="mt-8 text-center text-xs dark:text-white/40 text-black/40 inter">
              Remember your password?{' '}
              <Link to="/login" className="font-medium dark:text-white text-black hover:underline underline-offset-4">Sign In</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
