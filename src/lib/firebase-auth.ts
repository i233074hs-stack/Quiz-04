/**
 * Firebase phone-number authentication (Firebase JS SDK, modular API).
 *
 * Flow (same steps as https://firebase.google.com/docs/auth/android/phone-auth):
 *  1. sendOtp(phone, verifier)  → reCAPTCHA proves the request comes from this app, then
 *                                 Firebase texts a 6-digit code. Returns a ConfirmationResult.
 *  2. confirmOtp(result, code)  → builds the phone credential and signs the user in.
 */
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  type ApplicationVerifier,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

export type { ApplicationVerifier, ConfirmationResult, User };

export function sendOtp(phone: string, verifier: ApplicationVerifier): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phone, verifier);
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<User> {
  const credential = await confirmation.confirm(code);
  return credential.user;
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function currentUser(): User | null {
  return auth.currentUser;
}

export function logout(): Promise<void> {
  return signOut(auth);
}

/** Maps Firebase Auth error codes to messages that make sense to the user. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please check the code and try again.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'This OTP has expired. Request a new one.';
    case 'auth/invalid-phone-number':
    case 'auth/missing-phone-number':
      return 'That phone number is not valid. Use the format +923001234567.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a while and try again.';
    case 'auth/quota-exceeded':
      return 'The SMS quota for this Firebase project has been exceeded.';
    case 'auth/billing-not-enabled':
      return 'Real SMS needs the Firebase project on the Blaze plan. Use a test phone number from the Firebase console, or enable billing.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is disabled, or SMS to this region is not allowed. Check Authentication → Sign-in method and the SMS region policy in the Firebase console.';
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add it under Authentication → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'recaptcha/cancelled':
      return 'reCAPTCHA was cancelled. Tap "Send OTP" to try again.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}
