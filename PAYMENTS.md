# Payments

`PaymentProvider` is the only provider-facing contract. M-Pesa and card adapters own authentication, initiation, status checks, refunds, signatures/callback validation, provider IDs, and provider errors. ORUN owns catalog prices, discounts, orders, records, fulfillment, entitlements, ledgers, and reconciliation.

Never trust client amounts or frontend success. A verified, idempotent server webhook updates payment and order state inside a serializable transaction. Store no raw card number or CVV. Complete the chosen PCI-compliant card processor endpoints before production.
