export type OtpPurpose =
  | 'LOGIN'
  | 'REGISTER_CLINIC'
  | 'REGISTER_SOLO'
  | 'REGISTER_STAFF'
  | 'REGISTER_PATIENT';

export type OtpChallenge = {
  purpose: OtpPurpose;
  email: string;
  otpHash: string;
  attempts: number;
  userId?: string;
  payload?: unknown;
};

export type OtpPendingResponse = {
  otpSessionId: string;
  email: string;
  expiresIn: number;
};
