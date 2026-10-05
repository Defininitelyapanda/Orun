import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider, PaymentState, ProviderEvent } from "./payment-provider";

type CardResponse = Record<string, unknown>;
export class CardPaymentProvider implements PaymentProvider {
  readonly method = "CARD" as const;
  constructor(private config: { baseUrl: string; secret: string; webhookSecret: string }, private http: typeof fetch = fetch) {}
  private async call(path: string, init: RequestInit = {}): Promise<CardResponse> {
    const response = await this.http(this.config.baseUrl + path, { ...init, headers: { authorization: `Bearer ${this.config.secret}`, "content-type": "application/json", ...init.headers } });
    if (!response.ok) throw new Error("Card processor request failed");
    return response.json() as Promise<CardResponse>;
  }
  private state(value: string): PaymentState {
    return ({ succeeded: "SUCCEEDED", processing: "PROCESSING", failed: "FAILED", cancelled: "CANCELLED", refunded: "REFUNDED", partially_refunded: "PARTIALLY_REFUNDED" } as Record<string, PaymentState>)[value] ?? "PENDING";
  }
  async initiate(input: { paymentId: string; amount: bigint; currency: string; customer: { email?: string } }) {
    const body = await this.call("/v1/payments", { method: "POST", headers: { "idempotency-key": input.paymentId }, body: JSON.stringify({ amount: input.amount.toString(), currency: input.currency, reference: input.paymentId, customer_email: input.customer.email }) });
    return { transactionId: String(body.id), status: this.state(String(body.status)), nextAction: body.redirect_url ? { type: "REDIRECT" as const, value: String(body.redirect_url) } : { type: "NONE" as const } };
  }
  async status(id: string) {
    const body = await this.call(`/v1/payments/${encodeURIComponent(id)}`);
    return { status: this.state(String(body.status)), amount: body.amount ? BigInt(String(body.amount)) : undefined, currency: body.currency ? String(body.currency).toUpperCase() : undefined };
  }
  async refund(input: { transactionId: string; amount: bigint; currency: string; reason: string; idempotencyKey: string }) {
    const body = await this.call(`/v1/payments/${encodeURIComponent(input.transactionId)}/refunds`, { method: "POST", headers: { "idempotency-key": input.idempotencyKey }, body: JSON.stringify({ amount: input.amount.toString(), currency: input.currency, reason: input.reason }) });
    return { refundId: String(body.id), status: this.state(String(body.status)) };
  }
  async verifyWebhook(raw: Uint8Array, headers: Headers) {
    const signature = headers.get("x-provider-signature");
    if (!signature) return false;
    const expected = createHmac("sha256", this.config.webhookSecret).update(raw).digest();
    const actual = Buffer.from(signature, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  async parseWebhook(raw: Uint8Array): Promise<ProviderEvent> {
    const body = JSON.parse(new TextDecoder().decode(raw)) as { id?: unknown; data?: { payment_id?: unknown; status?: unknown; amount?: unknown; currency?: unknown } };
    if (!body.id || !body.data?.payment_id) throw new Error("Invalid card webhook");
    return { id: String(body.id), transactionId: String(body.data.payment_id), status: this.state(String(body.data.status)), amount: body.data.amount ? BigInt(String(body.data.amount)) : undefined, currency: body.data.currency ? String(body.data.currency).toUpperCase() : undefined, raw: body };
  }
}
