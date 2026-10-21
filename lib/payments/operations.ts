import type { PaymentState } from "./payment-provider";

export function reconciliationStatus(local:{status:string;amount:bigint;currency:string},provider:{status:PaymentState;amount?:bigint;currency?:string}){if(provider.amount!==undefined&&provider.amount!==local.amount)return "MISMATCH" as const;if(provider.currency&&provider.currency.toUpperCase()!==local.currency.toUpperCase())return "MISMATCH" as const;if(provider.status!==local.status)return "MISMATCH" as const;return "MATCHED" as const}
export function refundWorkflowFromProvider(status:PaymentState){if(status==="REFUNDED"||status==="PARTIALLY_REFUNDED")return "SUCCEEDED" as const;if(status==="FAILED"||status==="CANCELLED")return "FAILED" as const;return "PROCESSING" as const}
