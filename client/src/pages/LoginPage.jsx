import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { FlickeringGrid } from '../components/ui/FlickeringGrid';

const ADMIN_MAIL = 'thisisujjwalanand@gmail.com';

const inputClass =
  'w-full px-5 py-3.5 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.08] border-black/[0.08] dark:text-white text-black text-sm inter outline-none dark:focus:border-white/20 focus:border-black/20 transition-colors placeholder:dark:text-white/20 placeholder:text-black/30';
const labelClass =
  'text-[11px] font-medium uppercase tracking-wider dark:text-white/50 text-black/50 ml-1';

function InputField({ label, type = 'text', value, onChange, placeholder, children }) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
        {children}
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const photoInputRef = useRef(null);

  React.useEffect(() => { signOut(); }, []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', address: '', recoveryMail: '',
    securityQuestion: '', securityAnswer: '',
    photo: null
  });

  const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, etc.)');
      return;
    }
    setFormData((prev) => ({ ...prev, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsRateLimited(false);

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isSignUp) {
      if (!formData.name) { setError('Please enter your full name.'); return; }
      if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
      if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const fd = new FormData();
        fd.append('email', formData.email.trim());
        fd.append('password', formData.password);
        fd.append('fullName', formData.name.trim());
        fd.append('phoneNumber', formData.phone.trim());
        fd.append('address', formData.address.trim());
        fd.append('recoveryMail', formData.recoveryMail.trim());
        fd.append('securityQuestion', formData.securityQuestion.trim());
        fd.append('securityAnswer', formData.securityAnswer.trim());
        if (formData.photo) fd.append('photo', formData.photo);
        await signUp(fd);
      } else {
        await signIn(formData.email.trim(), formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('thisisujjwalanand@gmail.com') || msg.includes('Too many login')) {
        setIsRateLimited(true);
      } else {
        setError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setIsRateLimited(false);
    setPhotoPreview(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '', recoveryMail: '', securityQuestion: '', securityAnswer: '', photo: null });
  };

  const EyeIcon = ({ open }) => open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden py-20">
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
        <div className="flex gap-2 items-center">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </nav>

      {/* Auth Card */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] px-6"
      >
        <div className="p-8 rounded-3xl dark:bg-white/[0.02] bg-black/[0.02] dark:border dark:border-white/[0.08] border border-black/[0.08] backdrop-blur-2xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold uppercase tracking-wide outfit mb-2 dark:text-white text-black">
              {isSignUp ? t('signup_title') : t('login_title')}
            </h2>
            <p className="dark:text-white/40 text-black/40 text-sm inter">
              {isSignUp ? 'Join the next generation of healthcare' : t('login_sub')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Generic error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center inter">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rate limit banner */}
            <AnimatePresence>
              {isRateLimited && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-orange-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Too Many Attempts</span>
                  </div>
                  <p className="text-xs dark:text-white/60 text-black/60 inter">
                    Your account has been temporarily locked for security.
                  </p>
                  <a href={`mailto:${ADMIN_MAIL}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors underline underline-offset-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    Contact Admin: {ADMIN_MAIL}
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Sign Up Fields ── */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Profile Photo */}
                <div className="space-y-2">
                  <label className={labelClass}>Profile Photo <span className="opacity-50">(Optional)</span></label>
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="relative flex items-center gap-4 p-3 rounded-xl border-2 border-dashed dark:border-white/[0.10] border-black/[0.10] cursor-pointer hover:dark:border-white/20 hover:border-black/20 transition-colors group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover border dark:border-white/10 border-black/10 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full dark:bg-white/[0.05] bg-black/[0.05] flex items-center justify-center flex-shrink-0 group-hover:dark:bg-white/[0.08] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:text-white/30 text-black/30"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium dark:text-white/70 text-black/70">{photoPreview ? 'Photo selected ✓' : 'Upload profile photo'}</p>
                      <p className="text-[10px] dark:text-white/30 text-black/30 mt-0.5">JPG, PNG, WEBP (max 5MB)</p>
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>

                {/* Full Name */}
                <InputField label="Full Name *" value={formData.name} onChange={set('name')} placeholder="John Doe" />

                {/* Phone */}
                <InputField label="Phone Number" type="tel" value={formData.phone} onChange={set('phone')} placeholder="+91 98765 43210" />

                {/* Address */}
                <div className="space-y-1">
                  <label className={labelClass}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={set('address')}
                    placeholder="123 Main St, City, State"
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </motion.div>
            )}

            {/* Email (always visible) */}
            <InputField label={t('email') + ' *'} type="email" value={formData.email} onChange={set('email')} placeholder="you@example.com" />

            {/* Password (always visible) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className={labelClass}>{t('pass')} *</label>
                {!isSignUp && (
                  <Link to="/forgot-password" className="text-[11px] font-medium dark:text-white/40 text-black/40 hover:dark:text-white/80 hover:text-black/80 transition-colors">Forgot?</Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12 tracking-widest`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 dark:text-white/40 text-black/40 hover:dark:text-white/80 hover:text-black/80 transition-colors">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Sign Up extra fields continued */}
            {isSignUp && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className={labelClass}>Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="••••••••"
                    className={`${inputClass} tracking-widest`}
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px dark:bg-white/10 bg-black/10" />
                  <span className="text-[10px] font-medium uppercase tracking-wider dark:text-white/30 text-black/30">Account Recovery</span>
                  <div className="flex-1 h-px dark:bg-white/10 bg-black/10" />
                </div>

                {/* Recovery Mail */}
                <InputField label="Recovery Email" type="email" value={formData.recoveryMail} onChange={set('recoveryMail')} placeholder="backup@example.com" />

                {/* Security Question */}
                <div className="space-y-1">
                  <label className={labelClass}>Security Question</label>
                  <select
                    value={formData.securityQuestion}
                    onChange={set('securityQuestion')}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="" className="dark:bg-black bg-white">Select a question…</option>
                    <option value="What is your mother's maiden name?" className="dark:bg-black bg-white">What is your mother's maiden name?</option>
                    <option value="What was the name of your first pet?" className="dark:bg-black bg-white">What was the name of your first pet?</option>
                    <option value="What city were you born in?" className="dark:bg-black bg-white">What city were you born in?</option>
                    <option value="What was your childhood nickname?" className="dark:bg-black bg-white">What was your childhood nickname?</option>
                    <option value="What is the name of your favorite childhood friend?" className="dark:bg-black bg-white">What is the name of your favorite childhood friend?</option>
                    <option value="What was the make of your first car?" className="dark:bg-black bg-white">What was the make of your first car?</option>
                    <option value="What elementary school did you attend?" className="dark:bg-black bg-white">What elementary school did you attend?</option>
                  </select>
                </div>

                {/* Security Answer */}
                <InputField label="Security Answer" value={formData.securityAnswer} onChange={set('securityAnswer')} placeholder="Your answer (stored securely)" />
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl dark:bg-white dark:text-black bg-black text-white text-sm font-bold uppercase tracking-wider outfit transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 dark:shadow-[0_4px_20px_rgba(255,255,255,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isSignUp ? t('signup_title') : t('sign_in')}
            </button>
          </form>

          {/* OR divider + Google button (login only) */}
          {!isSignUp && (
            <>
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px dark:bg-white/10 bg-black/10" />
                <span className="text-[10px] font-medium uppercase tracking-wider dark:text-white/30 text-black/30">Or</span>
                <div className="flex-1 h-px dark:bg-white/10 bg-black/10" />
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setIsLoading(true);
                      await signInWithGoogle(credentialResponse.credential);
                      navigate('/dashboard');
                    } catch (err) {
                      setError(err.message || 'Google Login failed.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onError={() => {
                    setError('Google Login Failed');
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="100%"
                  className="w-full"
                />
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs dark:text-white/40 text-black/40 inter">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={switchMode} className="font-medium dark:text-white text-black hover:underline underline-offset-4">
              {isSignUp ? t('sign_in') : t('register')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
