// Accounts and syncing.
//
// Words, search history and collections are still kept in the browser
// (localStorage) so the app works offline and opens instantly. When someone
// signs in, each list is mirrored to Firestore under users/{uid}/{list}/{id}:
//
// - First sign-in on a device: what's in the account and what's on the device
//   are merged. Starter words that came with the app are only uploaded if the
//   account is still empty, so a new phone doesn't re-add words you deleted.
// - After that, local changes are written up (a moment after they happen) and
//   changes made on another device stream down live.
//
// Each item is stored as a JSON string, which sidesteps Firestore's rules about
// undefined values and nested arrays.
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  type Auth,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Firestore
} from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';
import { WordEntry, Collection } from '../types';
import { INITIAL_WORDS, INITIAL_COLLECTIONS } from '../data/initialData';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// On the live site, run Google sign-in on our own address (the server passes
// /__/auth/* through to Firebase). Safari on iPhone blocks the sign-in if it
// happens on a different site (firebaseapp.com) from the app.
const LIVE_HOSTS = ['saynest.me', 'saynest-43dd8710a441.herokuapp.com'];
const sameSiteAuthDomain =
  typeof window !== 'undefined' && LIVE_HOSTS.includes(window.location.hostname) ? window.location.host : null;

if (firebaseConfig) {
  app = initializeApp({ ...firebaseConfig, authDomain: sameSiteAuthDomain || firebaseConfig.authDomain });
  auth = getAuth(app);
  db = getFirestore(app);
}

/** False until the Firebase project details are filled in */
export const isCloudEnabled = !!app;

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'offline' | 'error';

// ---------------------------------------------------------------------------
// Signing in and out

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!auth);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);
  return { user, ready };
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('not-configured');
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error('not-configured');
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function createAccount(name: string, email: string, password: string) {
  if (!auth) throw new Error('not-configured');
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
}

export async function resetPassword(email: string) {
  if (!auth) throw new Error('not-configured');
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOut() {
  if (auth) await firebaseSignOut(auth);
}

/** Turn a Firebase error into something a person can act on */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || (err as Error)?.message || '';
  switch (code) {
    case 'auth/invalid-email':
      return "That email address doesn't look right.";
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/weak-password':
      return 'Use a password of at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'There is already an account with this email. Sign in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return "The email or password isn't right. Try again, or reset your password.";
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, or reset your password.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google window was closed before signing in finished.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site, or use email instead.';
    case 'auth/unauthorized-domain':
      return "Sign-in isn't allowed on this web address yet. Add it under Authentication → Settings → Authorized domains in Firebase.";
    case 'auth/network-request-failed':
      return "Couldn't reach the sign-in service. Check your connection and try again.";
    case 'auth/account-exists-with-different-credential':
      return 'This email already signs in another way. Try the other sign-in option.';
    default:
      return 'Something went wrong signing in. Please try again.';
  }
}

// ---------------------------------------------------------------------------
// Syncing

type Kind = 'words' | 'history' | 'collections';
type Item = { id: string };

const STARTER_IDS: Record<Kind, Set<string>> = {
  words: new Set(INITIAL_WORDS.map((w) => w.id)),
  history: new Set(INITIAL_WORDS.map((w) => w.id)),
  collections: new Set(INITIAL_COLLECTIONS.map((c) => c.id))
};

// Firestore document ids can't contain "/"
const docIdOf = (id: string) => id.replace(/\//g, '_') || '_';

// Words and history are newest first; collections keep their order (the
// first one is the book being read now), so they carry their position.
const sortKind = (kind: Kind, items: any[]) => {
  if (kind === 'collections') return [...items].sort((a, b) => (a._pos ?? 0) - (b._pos ?? 0)).map(({ _pos, ...c }) => c);
  const key = kind === 'history' ? 'searchedAt' : 'dateAdded';
  return [...items].sort((a, b) => String(b[key] || b.dateAdded || '').localeCompare(String(a[key] || a.dateAdded || '')));
};

const serialize = (kind: Kind, items: Item[]) => {
  const map = new Map<string, string>();
  items.forEach((item, index) => {
    const value = kind === 'collections' ? { ...item, _pos: index } : item;
    map.set(item.id, JSON.stringify(value));
  });
  return map;
};

const sameText = (a: any, b: any) =>
  typeof a?.word === 'string' && typeof b?.word === 'string' && a.word.toLowerCase() === b.word.toLowerCase();

interface SyncLists {
  words: WordEntry[];
  setWords: Dispatch<SetStateAction<WordEntry[]>>;
  history: WordEntry[];
  setHistory: Dispatch<SetStateAction<WordEntry[]>>;
  collections: Collection[];
  setCollections: Dispatch<SetStateAction<Collection[]>>;
}

export function useCloudSync(user: User | null, lists: SyncLists) {
  const [status, setStatus] = useState<SyncStatus>('off');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const uid = user?.uid || null;

  // What we believe is stored in the account, per list: id -> JSON
  const remote = useRef<Record<Kind, Map<string, string>>>({
    words: new Map(),
    history: new Map(),
    collections: new Map()
  });
  const ready = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listsRef = useRef(lists);
  listsRef.current = lists;

  const setters: Record<Kind, (fn: (prev: any[]) => any[]) => void> = {
    words: (fn) => listsRef.current.setWords(fn as any),
    history: (fn) => listsRef.current.setHistory(fn as any),
    collections: (fn) => listsRef.current.setCollections(fn as any)
  };
  const current = (kind: Kind): Item[] =>
    kind === 'words' ? listsRef.current.words : kind === 'history' ? listsRef.current.history : listsRef.current.collections;

  // 1. On sign-in: merge, then listen for changes from other devices
  useEffect(() => {
    ready.current = false;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    remote.current = { words: new Map(), history: new Map(), collections: new Map() };
    if (!uid || !db) {
      setStatus('off');
      return;
    }
    const firestore = db;
    let cancelled = false;
    const unsubscribers: (() => void)[] = [];
    setStatus('syncing');

    (async () => {
      try {
        const kinds: Kind[] = ['words', 'history', 'collections'];
        const fetched = await Promise.all(
          kinds.map((kind) => getDocs(collection(firestore, 'users', uid, kind)))
        );
        if (cancelled) return;

        const remoteItems: Record<Kind, any[]> = { words: [], history: [], collections: [] };
        kinds.forEach((kind, i) => {
          fetched[i].forEach((d) => {
            try {
              const json = d.data().json as string;
              const item = JSON.parse(json);
              remoteItems[kind].push(item);
              remote.current[kind].set(item.id, JSON.stringify(item));
            } catch {
              /* skip anything unreadable */
            }
          });
        });
        const accountIsEmpty = kinds.every((k) => remoteItems[k].length === 0);

        // Merge: everything in the account, plus anything only on this device
        for (const kind of kinds) {
          const local = current(kind);
          const extra = local.filter(
            (item: any) =>
              !remoteItems[kind].some((r) => r.id === item.id || (kind !== 'collections' && sameText(r, item))) &&
              (accountIsEmpty || !STARTER_IDS[kind].has(item.id))
          );
          const merged = sortKind(kind, [...remoteItems[kind], ...extra]);
          setters[kind](() => merged);
        }
        ready.current = true;
        // The merged lists now differ from the account by the device-only
        // extras; the push effect below uploads them.
        setStatus('synced');
        setLastSyncedAt(new Date());

        // Live updates from other devices
        for (const kind of kinds) {
          const unsub = onSnapshot(
            collection(firestore, 'users', uid, kind),
            { includeMetadataChanges: false },
            (snap) => {
              if (snap.metadata.hasPendingWrites) return; // our own write echoing back
              const changes = snap.docChanges();
              if (!changes.length) return;
              let changed = false;
              const upserts = new Map<string, any>();
              const removals = new Set<string>();
              for (const change of changes) {
                let item: any;
                try {
                  item = JSON.parse(change.doc.data().json);
                } catch {
                  continue;
                }
                const json = JSON.stringify(item);
                if (change.type === 'removed') {
                  if (remote.current[kind].has(item.id)) {
                    remote.current[kind].delete(item.id);
                    removals.add(item.id);
                    changed = true;
                  }
                } else if (remote.current[kind].get(item.id) !== json) {
                  remote.current[kind].set(item.id, json);
                  upserts.set(item.id, item);
                  changed = true;
                }
              }
              if (!changed) return;
              setters[kind]((prev) => {
                const next = prev
                  .filter((p: any) => !removals.has(p.id))
                  .map((p: any) => (upserts.has(p.id) ? upserts.get(p.id) : p));
                upserts.forEach((item, id) => {
                  if (!next.some((p: any) => p.id === id)) next.push(item);
                });
                return sortKind(kind, kind === 'collections' ? next.map((c: any, i: number) => ({ _pos: i, ...c })) : next);
              });
              setLastSyncedAt(new Date());
            },
            () => setStatus('error')
          );
          unsubscribers.push(unsub);
        }
      } catch (err) {
        console.warn('Sync failed to start:', err);
        if (!cancelled) setStatus(navigator.onLine ? 'error' : 'offline');
      }
    })();

    return () => {
      cancelled = true;
      unsubscribers.forEach((u) => u());
    };
  }, [uid]);

  // 2. Push local changes up, a moment after they happen
  useEffect(() => {
    if (!uid || !db || !ready.current) return;
    const firestore = db;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      // Never write after signing out or switching account: by then the lists
      // on screen are a fresh start, not this person's words
      if (!ready.current || auth?.currentUser?.uid !== uid) return;
      const writes: { kind: Kind; id: string; json: string | null }[] = [];
      for (const kind of ['words', 'history', 'collections'] as Kind[]) {
        const now = serialize(kind, current(kind));
        now.forEach((json, id) => {
          if (remote.current[kind].get(id) !== json) writes.push({ kind, id, json });
        });
        remote.current[kind].forEach((_json, id) => {
          if (!now.has(id)) writes.push({ kind, id, json: null });
        });
      }
      if (!writes.length) return;
      setStatus('syncing');
      try {
        // Firestore allows 500 writes per batch
        for (let i = 0; i < writes.length; i += 450) {
          const batch = writeBatch(firestore);
          for (const w of writes.slice(i, i + 450)) {
            const ref = doc(firestore, 'users', uid, w.kind, docIdOf(w.id));
            if (w.json === null) batch.delete(ref);
            else batch.set(ref, { id: w.id, json: w.json, updatedAt: Date.now() });
          }
          await batch.commit();
          for (const w of writes.slice(i, i + 450)) {
            if (w.json === null) remote.current[w.kind].delete(w.id);
            else remote.current[w.kind].set(w.id, w.json);
          }
        }
        setStatus('synced');
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Sync write failed:', err);
        setStatus(navigator.onLine ? 'error' : 'offline');
      }
    }, 800);
  }, [uid, lists.words, lists.history, lists.collections]);

  // Try again when the connection comes back
  useEffect(() => {
    const onOnline = () => {
      if (uid && ready.current) listsRef.current.setWords((w) => [...w]); // nudges the push effect
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [uid]);

  return { status, lastSyncedAt };
}
