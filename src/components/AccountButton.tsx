import React from 'react';
import type { User } from 'firebase/auth';
import { UserRound } from 'lucide-react';
import type { SyncStatus } from '../utils/cloudSync';

interface AccountButtonProps {
  user: User | null;
  syncStatus: SyncStatus;
  onClick: () => void;
}

const dotClass: Record<SyncStatus, string> = {
  off: 'bg-stone-300',
  syncing: 'bg-amber-400 animate-pulse',
  synced: 'bg-emerald-500',
  offline: 'bg-stone-400',
  error: 'bg-rose-500'
};

/** "Sign in" when signed out; your picture or initial with a sync dot when signed in */
export const AccountButton: React.FC<AccountButtonProps> = ({ user, syncStatus, onClick }) => {
  if (!user) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="py-2 px-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
      >
        <UserRound className="w-4 h-4" />
        <span>Sign in</span>
      </button>
    );
  }
  const initial = (user.displayName || user.email || '?').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Account (${syncStatus === 'synced' ? 'synced' : syncStatus})`}
      title="Your account and syncing"
      className="relative w-9 h-9 rounded-full shrink-0 ring-2 ring-white shadow-xs"
    >
      {user.photoURL ? (
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full" />
      ) : (
        <span className="w-9 h-9 rounded-full bg-stone-900 text-[#FFE042] flex items-center justify-center text-sm font-bold">
          {initial}
        </span>
      )}
      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dotClass[syncStatus]}`} />
    </button>
  );
};
