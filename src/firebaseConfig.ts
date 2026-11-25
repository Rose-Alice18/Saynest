import type { FirebaseOptions } from 'firebase/app';

// Firebase web config for the SayNest project.
//
// These values are public by design: they only say which Firebase project to
// talk to. What protects your words is the Firestore security rules, which only
// let a signed-in person read and write their own data (see README).
//
// Set this to null to hide sign-in and keep words in the browser only.
export const firebaseConfig: FirebaseOptions | null = {
  apiKey: 'AIzaSyC2CK2x2vBC3vT-iX2Mh4Om2d0izfCiLz8',
  authDomain: 'saynest.firebaseapp.com',
  projectId: 'saynest',
  storageBucket: 'saynest.firebasestorage.app',
  messagingSenderId: '1043012431377',
  appId: '1:1043012431377:web:b05ed6bf334f7a11b4cbb0'
};
