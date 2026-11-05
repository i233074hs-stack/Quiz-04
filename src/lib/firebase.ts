/**
 * Firebase initialisation for Android / iOS (the web version is firebase.web.ts).
 * Uses the Firebase JS SDK with the web app config, so it runs in Expo Go.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';

import { firebaseConfig } from '@/config/firebase-config';

// The React Native build of firebase/auth exports getReactNativePersistence,
// but the package's shared TypeScript typings leave it out.
const { getAuth, initializeAuth, getReactNativePersistence } = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence(storage: typeof AsyncStorage): FirebaseAuth.Persistence;
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): FirebaseAuth.Auth {
  try {
    // Keep the user signed in between app launches.
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialised (e.g. after a Fast Refresh).
    return getAuth(app);
  }
}

export const auth = createAuth();
