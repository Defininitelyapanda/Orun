"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Document {
    modelContext?: { registerTool(tool: { name: string; title?: string; description: string; inputSchema: object; execute(input: unknown): unknown; annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean } }, options?: { signal?: AbortSignal }): void | Promise<void> };
  }
}

export function WebMcpTools() {
  const router = useRouter();
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "start_catalog_search",
      title: "Search ORUN",
      description: "Open ORUN search with a film, filmmaker, genre, or country query.",
      inputSchema: { type: "object", properties: { query: { type: "string", minLength: 1, maxLength: 100 } }, required: ["query"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const query = (input as { query?: unknown }).query;
        if (typeof query !== "string" || !query.trim()) throw new Error("A search query is required");
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        return { status: "opened", query: query.trim() };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, [router]);
  return null;
}
