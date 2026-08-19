// Decodes a JWT's payload without verifying the signature (verification is the
// server's job) — used client-side purely to decide whether to bother sending
// a token we already know is stale.
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload) return true;
  if (!payload.exp) return false; // no expiry claim: treat as non-expiring
  return Date.now() >= payload.exp * 1000;
};
