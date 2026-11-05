# i233074-Quiz04 — Firebase OTP Phone Login

An Expo (SDK 58) React Native app that logs a user in with their phone number using
**Firebase Authentication** (SMS one-time password). It uses the Firebase JS SDK with the
project's **Web app** config, so it runs in **Expo Go** (Android / iOS) and in the browser —
no native build needed. The flow follows
[Authenticate with Firebase using a Phone Number](https://firebase.google.com/docs/auth/android/phone-auth).

1. The user enters their phone number (international format, e.g. `+923001234567`).
2. A reCAPTCHA check runs, then Firebase sends a 6-digit OTP by SMS.
3. The user enters the OTP.
4. The app verifies it: a wrong or expired code shows a failure message; a correct code opens the **Login Successful** page.

| File | Purpose |
| --- | --- |
| `src/config/firebase-config.ts` | Firebase web app config |
| `src/lib/firebase.ts` / `firebase.web.ts` | Firebase initialisation (native keeps the session in AsyncStorage) |
| `src/lib/firebase-auth.ts` | `signInWithPhoneNumber`, `confirm`, `signOut`, and error messages |
| `src/components/recaptcha-verifier.tsx` | Native: "I'm not a robot" check in a WebView, token passed to Firebase |
| `src/components/recaptcha-verifier.web.tsx` | Web: Firebase's invisible `RecaptchaVerifier` |
| `src/app/index.tsx` | Login page: phone number → OTP entry, resend timer, error messages |
| `src/app/success.tsx` | Successful-login page with the verified number and a Logout button |

## Firebase console setup

0. **Add a Web app** to your Firebase project and paste its `firebaseConfig` into
   `src/config/firebase-config.ts`.
1. **Authentication → Sign-in method → Phone → Enable.**
2. **Authentication → Settings → SMS region policy:** allow your country (for example, Pakistan).
   New projects allow no regions, so no SMS is sent until you set one.
3. **Authentication → Settings → Authorized domains:** `localhost` and
   `<your-project-id>.firebaseapp.com` must be listed (they are by default).
4. **Testing without real SMS (recommended for the demo):** Authentication → Sign-in method →
   Phone → **Phone numbers for testing** → add e.g. `+1 650-555-3434` with code `123456`.
   No SMS is sent; type the fixed code instead. If Firebase reports that billing is not enabled,
   real SMS needs the Blaze plan, but test numbers still work.

## Run

```bash
npm install
npx expo start
```

- **Phone:** scan the QR code with **Expo Go**.
- **Browser:** press `w` (or `npm run web`).
