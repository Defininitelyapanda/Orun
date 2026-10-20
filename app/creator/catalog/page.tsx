import { AppShell } from "@/components/navigation/app-shell";
import { ClassificationEditor } from "@/components/taxonomy/classification-editor";
import { films } from "@/server/demo/catalog";
export const metadata={title:"Creator catalogue"};
export default function CreatorCatalogue(){return <AppShell><p className="eyebrow">Creator workspace</p><h1 className="font-display text-4xl md:text-6xl">Film classifications</h1><p className="mt-3 mb-8 max-w-2xl text-white/55">Suggest richer metadata for your uploaded titles. Editorial review protects the shared ORUN taxonomy.</p><ClassificationEditor films={films} mode="creator"/></AppShell>}
