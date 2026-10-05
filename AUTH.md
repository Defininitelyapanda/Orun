# Authentication

Passwords use PBKDF2-SHA-256 with 600,000 iterations. Sessions store only SHA-256 token hashes; the raw token is an HttpOnly, Secure, SameSite cookie. Reset tokens are random, hashed, expiring, single-use, and revoke prior sessions after use. WebAuthn records store credential public keys and counters, never biometric data.

Before launch, connect transactional email, add email verification endpoints, implement WebAuthn ceremonies with `@simplewebauthn/server`, enforce rate limits, and require TOTP/WebAuthn 2FA for admin roles.
