import { AppShell } from "@/components/navigation/app-shell";
import { CreatorInbox } from "@/components/creator/creator-inbox";
export const metadata={title:"Messages & Feedback"};
export default function CreatorMessagesPage(){return <AppShell><p className="eyebrow">Creator studio</p><h1 className="mb-8 font-display text-4xl md:text-5xl">Messages &amp; Feedback</h1><CreatorInbox/></AppShell>}
