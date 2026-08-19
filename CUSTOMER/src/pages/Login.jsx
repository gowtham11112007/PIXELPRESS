import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CheckCircle2, Phone, User as UserIcon, LogOut, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function Login() {
  const { user, supabaseUser, login, logout, authLoading } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // If already logged in with phone, navigate home
  useEffect(() => {
    if (user && user.phone) {
      navigate('/');
    }
  }, [user, navigate]);

  // Pre-fill name and email when Google auth succeeds
  useEffect(() => {
    if (supabaseUser) {
      const googleName =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email?.split('@')[0] ||
        '';
      setName(prev => prev || googleName);
    }
  }, [supabaseUser]);

  // Handler: Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSigningInGoogle(true);

      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured yet. Please check your environment variables.');
      }

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (authError) throw authError;
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(err.message || 'Failed to initialize Google Sign In.');
      setIsSigningInGoogle(false);
    }
  };

  // Handler: Complete Onboarding / Profile (Save Name + Phone)
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      await login(name.trim(), phone.trim(), {
        email: supabaseUser?.email || '',
        avatar: supabaseUser?.user_metadata?.avatar_url || supabaseUser?.user_metadata?.picture || null,
        id: supabaseUser?.id || null
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    }
  };

  // Handler: Direct Manual Login (Fallback)
  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!phone.match(/^\d{10}$/)) { setError('Please enter a valid 10-digit phone number.'); return; }

    try {
      await login(name.trim(), phone.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to log in.');
    }
  };

  const avatarUrl = supabaseUser?.user_metadata?.avatar_url || supabaseUser?.user_metadata?.picture;
  const userEmail = supabaseUser?.email;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top accent */}
      <div className="h-1 bg-black w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-3 shadow-md">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">PixelPress</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Custom Posters, Delivered on Campus
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <p className="text-xs text-gray-500 font-medium">Checking authentication...</p>
            </div>
          ) : supabaseUser && !user?.phone ? (
            /* STEP 2: Google Authenticated -> Complete Profile with Phone Number */
            <div>
              <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold rounded-none mb-5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Google Account Connected</span>
              </div>

              {/* User Google Badge */}
              <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 border border-gray-100">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Google Profile"
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                    {name ? name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {supabaseUser.user_metadata?.full_name || name || 'Signed in'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Complete Your Profile
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your phone number so we can notify you about poster delivery on campus.
                </p>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div>
                  <label htmlFor="google-name" className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    id="google-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Gowtham Yuvaraj"
                    className="w-full border border-gray-300 rounded-none px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="google-phone" className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    Phone Number (10 Digits)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-gray-400 font-semibold select-none">
                      +91
                    </span>
                    <input
                      id="google-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full border border-gray-300 rounded-none pl-11 pr-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors placeholder-gray-400"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white text-xs font-semibold py-3 tracking-widest uppercase transition-all flex items-center justify-center space-x-2 mt-2 active:scale-[0.98]"
                >
                  <span>Continue to Store</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={logout}
                  className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Use a different Google account</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: Sign in with Google (Primary) or Manual Login */
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1 text-center">
                Sign in to PixelPress
              </h2>
              <p className="text-xs text-gray-500 text-center mb-6">
                Sign in with Google to explore posters and track your orders.
              </p>

              {/* Primary Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInGoogle}
                className="w-full border border-gray-300 hover:border-black bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold py-3 px-4 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                {isSigningInGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {error && (
                <p className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2 mt-4">
                  {error}
                </p>
              )}

              {/* Divider for manual fallback */}
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  or
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {!showManualForm ? (
                <button
                  type="button"
                  onClick={() => setShowManualForm(true)}
                  className="w-full text-xs text-gray-600 hover:text-black font-semibold py-2 border border-dashed border-gray-300 hover:border-gray-400 transition-colors uppercase tracking-wider text-center"
                >
                  Continue with Phone & Name
                </button>
              ) : (
                <form onSubmit={handleManualLogin} className="space-y-4 pt-1">
                  <div>
                    <label htmlFor="manual-name" className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      id="manual-name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Gowtham Yuvaraj"
                      className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="manual-phone" className="block text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      id="manual-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white text-xs font-semibold py-2.5 tracking-widest uppercase transition-colors active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </form>
              )}

              <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
                By continuing, you agree to receive order and delivery updates on campus.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
