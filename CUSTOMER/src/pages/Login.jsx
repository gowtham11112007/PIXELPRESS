import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CheckCircle2, LogOut, Loader2 } from 'lucide-react';
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
  const { user, supabaseUser, login, logout, authLoading, storeSettings } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

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
        throw new Error('Cloud auth is not active. You can log in instantly with your Phone number below.');
      }

      const redirectUrl = window.location.origin;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (authError) throw authError;
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(err.message || 'Google OAuth is redirecting. You can also sign in directly with Phone below.');
      setIsSigningInGoogle(false);
    }
  };

  // Handler: Complete Onboarding / Profile (Save Name + Phone)
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setError('');
    const finalName = name.trim() || supabaseUser?.user_metadata?.full_name || 'Student';

    if (!phone.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      await login(finalName, phone.trim(), {
        email: supabaseUser?.email || '',
        avatar: supabaseUser?.user_metadata?.avatar_url || supabaseUser?.user_metadata?.picture || null,
        id: supabaseUser?.id || null
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    }
  };



  const avatarUrl = supabaseUser?.user_metadata?.avatar_url || supabaseUser?.user_metadata?.picture;
  const userEmail = supabaseUser?.email;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {storeSettings?.storeName || 'PixelPress'}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Next-Day Campus Poster & Merch Delivery
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-8 shadow-xl rounded-3xl border border-slate-200">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
              <p className="text-xs text-slate-500 font-medium">Loading sign-in...</p>
            </div>
          ) : supabaseUser && !user?.phone ? (
            /* STEP 2: Google Authenticated -> Complete Profile with Phone Number */
            <div>
              <div className="flex items-center space-x-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold rounded-xl mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Account Connected</span>
              </div>

              {/* User Google Badge */}
              <div className="flex items-center space-x-3 mb-5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Google Profile"
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-sm">
                    {name ? name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {supabaseUser.user_metadata?.full_name || name || 'Student'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Enter Your WhatsApp Phone
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Used for delivery alerts and order updates.
                </p>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-3">
                <div>
                  <label htmlFor="google-phone" className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                    Phone Number (10 Digits)
                  </label>
                  <input
                    id="google-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-field text-sm"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-black text-white text-xs font-bold py-3 uppercase tracking-widest transition-all rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <span>Complete Login & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-red-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Use different account</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: Google 1-Click Login Only */
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 text-center">
                  Sign in to Order
                </h2>
                <p className="text-xs text-slate-500 text-center mt-1">
                  Please securely sign in with your Google account to continue.
                </p>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInGoogle}
                className="w-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-xs disabled:opacity-50"
              >
                {isSigningInGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
