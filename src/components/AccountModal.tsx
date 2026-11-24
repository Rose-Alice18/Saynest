import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { X, Mail, Loader2, CheckCircle2, CloudOff, RefreshCw, AlertTriangle, LogOut } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  createAccount,
  resetPassword,
  authErrorMessage,
  type SyncStatus
} from '../utils/cloudSync';

interface AccountModalProps {
  user: User | null;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  onClose: () => void;
  onSignOut: () => void;
}

const inputClass =
  'w-full p-3 bg-white rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]';

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const statusLine = (status: SyncStatus, last: Date | null) => {
  const when = last ? last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  switch (status) {
    case 'syncing':
      return { icon: <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />, text: 'Syncing your words…' };
    case 'synced':
      return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, text: `Synced${when ? ` at ${when}` : ''}. Your words are the same on every device you sign in on.` };
    case 'offline':
      return { icon: <CloudOff className="w-4 h-4 text-stone-600" />, text: "You're offline. Changes are saved on this device and will sync when you're back online." };
    case 'error':
      return { icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, text: "Couldn't sync just now. Your words are safe on this device; SayNest will keep trying." };
    default:
      return { icon: <RefreshCw className="w-4 h-4 text-stone-500" />, text: 'Getting ready to sync…' };
  }
};

export const AccountModal: React.FC<AccountModalProps> = ({ user, syncStatus, lastSyncedAt, onClose, onSignOut }) => {
  const [mode, setMode] = useState<'signin' | 'create' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (kind: 'google' | 'email', action: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      run('email', async () => {
        await resetPassword(email);
        setNotice(`If there's an account for ${email.trim()}, a reset link is on its way. Check your inbox and spam folder.`);
      });
    } else if (mode === 'create') {
      run('email', () => createAccount(name, email, password));
    } else {
      run('email', () => signInWithEmail(email, password));
    }
  };

  const status = statusLine(syncStatus, lastSyncedAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 id="account-title" className="font-bold text-stone-900 text-lg font-serif-display">
            {user ? 'Your account' : mode === 'create' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in to SayNest'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#FFE042] flex items-center justify-center font-bold text-stone-900">
                  {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                {user.displayName && <div className="font-bold text-stone-900 truncate">{user.displayName}</div>}
                <div className="text-xs text-stone-600 truncate">{user.email}</div>
              </div>
            </div>
            <div role="status" className="flex items-start gap-2 p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed">
              <span className="shrink-0 mt-0.5">{status.icon}</span>
              <span>{status.text}</span>
            </div>
            <button
              onClick={onSignOut}
              className="w-full py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
            <p className="text-[11px] text-stone-500 text-center">
              Signing out removes your words from this device. They stay safe in your account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              Sign in to keep your saved words, history and collections in sync on your phone and laptop.
              Anything already on this device is added to your account.
            </p>

            {mode !== 'reset' && (
              <>
                <button
                  onClick={() => run('google', signInWithGoogle)}
                  disabled={!!busy}
                  className="w-full py-3 bg-white hover:bg-stone-50 disabled:opacity-60 border border-stone-300 text-stone-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5"
                >
                  {busy === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleMark />}
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
                  <span className="h-px flex-1 bg-stone-200" />
                  or with email
                  <span className="h-px flex-1 bg-stone-200" />
                </div>
              </>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'create' && (
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  aria-label="Your name"
                  className={inputClass}
                />
              )}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className={inputClass}
              />
              {mode !== 'reset' && (
                <input
                  type="password"
                  autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'create' ? 'Choose a password (6+ characters)' : 'Password'}
                  aria-label="Password"
                  className={inputClass}
                />
              )}

              {error && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  {error}
                </div>
              )}
              {notice && (
                <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={!!busy}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                {busy === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {mode === 'create' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs">
              {mode === 'signin' ? (
                <>
                  <button onClick={() => { setMode('create'); setError(null); }} className="font-semibold text-stone-800 underline">
                    Create an account
                  </button>
                  <button onClick={() => { setMode('reset'); setError(null); }} className="text-stone-600 underline">
                    Forgot password?
                  </button>
                </>
              ) : (
                <button onClick={() => { setMode('signin'); setError(null); setNotice(null); }} className="font-semibold text-stone-800 underline">
                  {mode === 'create' ? 'I already have an account' : 'Back to sign in'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
