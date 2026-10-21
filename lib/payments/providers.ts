import { CardPaymentProvider } from "./card-provider";
import { MpesaPaymentProvider } from "./mpesa-provider";
import { PaymentService } from "./payment-service";

export function configuredPaymentService(source:NodeJS.ProcessEnv=process.env){const providers=[];if(source.MPESA_BASE_URL&&source.MPESA_CONSUMER_KEY&&source.MPESA_CONSUMER_SECRET&&source.MPESA_SHORTCODE&&source.MPESA_PASSKEY&&source.MPESA_CALLBACK_URL)providers.push(new MpesaPaymentProvider({baseUrl:source.MPESA_BASE_URL,consumerKey:source.MPESA_CONSUMER_KEY,consumerSecret:source.MPESA_CONSUMER_SECRET,shortcode:source.MPESA_SHORTCODE,passkey:source.MPESA_PASSKEY,callbackUrl:source.MPESA_CALLBACK_URL}));if(source.CARD_BASE_URL&&source.CARD_SECRET&&source.CARD_WEBHOOK_SECRET)providers.push(new CardPaymentProvider({baseUrl:source.CARD_BASE_URL,secret:source.CARD_SECRET,webhookSecret:source.CARD_WEBHOOK_SECRET}));return new PaymentService(providers)}
