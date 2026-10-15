"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function FilmShareButton({ title }: { title: string }) {
  const [status, setStatus] = useState("");
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${title} on ORUN`, text: `Watch ${title} on ORUN`, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setStatus("Link copied"); }
    } catch (error) { if ((error as Error).name !== "AbortError") setStatus("Sharing unavailable"); }
  };
  return <div className="flex items-center gap-2"><button type="button" onClick={share} className="glass-action"><Share2 size={18} /> Share</button>{status && <span role="status" className="text-xs text-amber">{status}</span>}</div>;
}
