import { HttpEmailProvider } from "@/lib/email/email-provider";

export async function sendVerificationCode(kind: "email" | "phone", target: string, code: string) {
  if (kind === "email") {
    const { EMAIL_API_URL, EMAIL_API_KEY, EMAIL_FROM } = process.env;
    if (!EMAIL_API_URL || !EMAIL_API_KEY || !EMAIL_FROM) return false;
    await new HttpEmailProvider(EMAIL_API_URL, EMAIL_API_KEY, EMAIL_FROM).send({
      to: target,
      subject: "Verify your ORUN account",
      text: `Your ORUN verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your ORUN verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
    return true;
  }
  const { SMS_API_URL, SMS_API_KEY, SMS_FROM } = process.env;
  if (!SMS_API_URL || !SMS_API_KEY || !SMS_FROM) return false;
  const response = await fetch(SMS_API_URL, { method: "POST", headers: { authorization: `Bearer ${SMS_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: SMS_FROM, to: target, text: `Your ORUN verification code is ${code}. It expires in 10 minutes.` }) });
  if (!response.ok) throw new Error("SMS_DELIVERY_FAILED");
  return true;
}

export async function sendPasswordReset(email: string, token: string, origin: string) {
  const { EMAIL_API_URL, EMAIL_API_KEY, EMAIL_FROM } = process.env;
  if (!EMAIL_API_URL || !EMAIL_API_KEY || !EMAIL_FROM) return false;
  const resetUrl = new URL("/auth/reset-password", origin);
  resetUrl.searchParams.set("token", token);
  await new HttpEmailProvider(EMAIL_API_URL, EMAIL_API_KEY, EMAIL_FROM).send({
    to: email,
    subject: "Reset your ORUN password",
    text: `Reset your ORUN password using this single-use link: ${resetUrl}. It expires in 30 minutes.`,
    html: `<p>Use this single-use link to reset your ORUN password:</p><p><a href="${resetUrl}">Reset password</a></p><p>It expires in 30 minutes.</p>`,
  });
  return true;
}
