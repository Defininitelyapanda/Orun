import { z } from "zod";

const optionalUrl=z.string().url().optional();
const environmentSchema=z.object({
 NODE_ENV:z.enum(["development","test","production"]).default("development"),
 DATABASE_URL:z.string().url().optional(),REDIS_URL:z.string().url().optional(),NEXT_PUBLIC_APP_URL:optionalUrl,CDN_URL:optionalUrl,
 PLAYBACK_SIGNING_SECRET:z.string().min(32).optional(),AUTH_SECRET:z.string().min(32).optional(),HEALTHCHECK_TOKEN:z.string().min(24).optional(),
 STORAGE_ENDPOINT:optionalUrl,STORAGE_REGION:z.string().optional(),STORAGE_BUCKET:z.string().optional(),STORAGE_ACCESS_KEY:z.string().optional(),STORAGE_SECRET_KEY:z.string().optional(),
 EMAIL_API_URL:optionalUrl,EMAIL_API_KEY:z.string().optional(),EMAIL_FROM:z.string().email().optional(),
 MPESA_BASE_URL:optionalUrl,MPESA_CONSUMER_KEY:z.string().optional(),MPESA_CONSUMER_SECRET:z.string().optional(),MPESA_SHORTCODE:z.string().optional(),MPESA_PASSKEY:z.string().optional(),MPESA_CALLBACK_URL:optionalUrl,
 CARD_BASE_URL:optionalUrl,CARD_SECRET:z.string().optional(),CARD_WEBHOOK_SECRET:z.string().optional(),
});
export type EnvironmentReport={valid:boolean;missing:string[];invalid:string[];capabilities:Record<string,boolean>};
const groups={database:["DATABASE_URL"],playback:["PLAYBACK_SIGNING_SECRET","CDN_URL"],queue:["REDIS_URL"],storage:["STORAGE_ENDPOINT","STORAGE_REGION","STORAGE_BUCKET","STORAGE_ACCESS_KEY","STORAGE_SECRET_KEY"],email:["EMAIL_API_URL","EMAIL_API_KEY","EMAIL_FROM"],mpesa:["MPESA_BASE_URL","MPESA_CONSUMER_KEY","MPESA_CONSUMER_SECRET","MPESA_SHORTCODE","MPESA_PASSKEY","MPESA_CALLBACK_URL"],card:["CARD_BASE_URL","CARD_SECRET","CARD_WEBHOOK_SECRET"]}as const;
export function inspectEnvironment(source:NodeJS.ProcessEnv=process.env):EnvironmentReport{const parsed=environmentSchema.safeParse(source),invalid=parsed.success?[]:parsed.error.issues.map(issue=>issue.path.join("."));const required=source.NODE_ENV==="production"?["DATABASE_URL","PLAYBACK_SIGNING_SECRET","CDN_URL","AUTH_SECRET"]:[];const missing=required.filter(key=>!source[key]);const capabilities=Object.fromEntries(Object.entries(groups).map(([name,keys])=>[name,keys.every(key=>Boolean(source[key]))]));return{valid:invalid.length===0&&missing.length===0,missing,invalid,capabilities}}
export function requireEnvironment(){const report=inspectEnvironment();if(!report.valid)throw new Error(`INVALID_ENVIRONMENT:${[...report.missing,...report.invalid].join(",")}`);return environmentSchema.parse(process.env)}
