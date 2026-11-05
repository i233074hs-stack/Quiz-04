/** E.164 phone format required by Twilio: "+", country code, subscriber number (max 15 digits). */
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export const OTP_LENGTH = 6;

/** Strips the spaces, dashes and brackets people commonly type into phone numbers. */
export function normalizePhone(input: string): string {
  return input.replace(/[\s\-()]/g, '');
}

export function isValidPhone(phone: string): boolean {
  return E164_PATTERN.test(phone);
}
