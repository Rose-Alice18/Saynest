// Firebase itself (about half the app's download). It's loaded separately, just
// after the first screen appears, so the app opens quickly on slow connections.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

export {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';
export { collection, doc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';

// On the live site, run Google sign-in on our own address (the server passes
// /__/auth/* through to Firebase). Safari on iPhone blocks the sign-in if it
// happens on a different site (firebaseapp.com) from the app.
const LIVE_HOSTS = ['saynest.me', 'saynest-43dd8710a441.herokuapp.com'];
const sameSiteAuthDomain = LIVE_HOSTS.includes(window.location.hostname) ? window.location.host : null;

if (!firebaseConfig) throw new Error('Firebase is not configured');
const app = initializeApp({ ...firebaseConfig, authDomain: sameSiteAuthDomain || firebaseConfig.authDomain });
export const auth = getAuth(app);
export const db = getFirestore(app);
