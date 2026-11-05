/** Firebase initialisation for the web build (browser persistence is the default). */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from '@/config/firebase-config';

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
