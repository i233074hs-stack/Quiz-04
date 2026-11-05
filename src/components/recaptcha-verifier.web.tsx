/**
 * reCAPTCHA for Firebase phone auth in the browser: Firebase's own invisible
 * RecaptchaVerifier, attached to an empty element on the page.
 */
import { RecaptchaVerifier, type ApplicationVerifier } from 'firebase/auth';
import { useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';

import { auth } from '@/lib/firebase';

const CONTAINER_ID = 'recaptcha-container';

export function useRecaptchaVerifier(): {
  getVerifier: () => ApplicationVerifier;
  recaptcha: ReactNode;
} {
  const verifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(
    () => () => {
      verifier.current?.clear();
      verifier.current = null;
    },
    []
  );

  function getVerifier() {
    verifier.current ??= new RecaptchaVerifier(auth, CONTAINER_ID, { size: 'invisible' });
    return verifier.current;
  }

  return { getVerifier, recaptcha: <View nativeID={CONTAINER_ID} /> };
}
