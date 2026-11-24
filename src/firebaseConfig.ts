import type { FirebaseOptions } from 'firebase/app';

// Firebase web config for the SayNest project.
//
// These values are public by design: they only say which Firebase project to
// talk to. What protects your words is the Firestore security rules, which only
// let a signed-in person read and write their own data (see README).
//
// While this is null, sign-in and syncing are hidden and the app keeps working
// with words stored only in the browser.
export const firebaseConfig: FirebaseOptions | null = null;
