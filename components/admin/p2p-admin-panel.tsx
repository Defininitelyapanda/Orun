"use client";

import { useEffect, useState } from "react";
import { Download, FlaskConical, Plus, RefreshCcw, ShieldCheck } from "lucide-react";

type Diagnostic = { id: string; filmId: string; deliveryMethod: string; browserCategory: string | null; deviceCategory: string | null; sourceStatus: string; timeToFirstFrameMs: number | null; playbackDurationMs: number; bufferingDurationMs: number; failureCategory: string | null; fallbackUsed: boolean; fallbackOutcome: string | null; startedAt: string };
type Overview = { sources: Record<string, number>; totalTitles: number; attempts: number; successful: number; medianTimeToFirstFrameMs: number | null; failureRate: number; fallbackRate: number; measuredBytesFromPeers: number; recentSessions: Diagnostic[] };
type Source = { id: string; filmId: string; titleSnapshot: string; sourceType: string; status: string; authorizationVerified: boolean; ownershipStatus: string; manifestUrl?: string; infoHash?: string; authorizationReference: string; durationSeconds: number; languages: string[]; subtitles: unknown[]; deliveryMethod: string };
type Config = { enabled: boolean; adminEnabled: boolean; browserEnabled: boolean; diagnosticsEnabled: boolean; startupTimeoutMs: number; permittedSourceTypes: ("WEBTORRENT" | "TORRENT_METADATA")[]; diagnosticsRetentionDays: number; fallbackEnabled: boolean; maxPlaybackDurationSeconds: number; maxTransferBytes?: number; peerUploadEnabled: boolean };

export function P2PAdminPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ filmId: "", authorizationReference: "", manifestUrl: "", infoHash: "", durationSeconds: 60 });

  const load = async () => {
    const [overviewResponse, sourceResponse, configResponse] = await Promise.all([fetch("/api/lab/p2p/overview"), fetch("/api/lab/p2p/sources"), fetch("/api/lab/p2p/config")]);
    if (overviewResponse.ok) setOverview(await overviewResponse.json() as Overview);
    if (sourceResponse.ok) setSources((await sourceResponse.json() as { sources: Source[] }).sources);
    if (configResponse.ok) setConfig(await configResponse.json() as Config);
    if (!overviewResponse.ok || !sourceResponse.ok) setMessage("Sign in with an active P2P administrator role and enable ORUN_P2P_ADMIN_ENABLED to manage the lab.");
  };
  useEffect(() => {
    let active = true;
    void Promise.all([fetch("/api/lab/p2p/overview"), fetch("/api/lab/p2p/sources"), fetch("/api/lab/p2p/config")]).then(async ([overviewResponse, sourceResponse, configResponse]) => {
      if (!active) return;
      if (overviewResponse.ok) setOverview(await overviewResponse.json() as Overview);
      if (sourceResponse.ok) setSources((await sourceResponse.json() as { sources: Source[] }).sources);
      if (configResponse.ok) setConfig(await configResponse.json() as Config);
      if (!overviewResponse.ok || !sourceResponse.ok) setMessage("Sign in with an active P2P administrator role and enable ORUN_P2P_ADMIN_ENABLED to manage the lab.");
    });
    return () => { active = false; };
  }, []);

  const createSource = async () => {
    setMessage("");
    const response = await fetch("/api/lab/p2p/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      filmId: form.filmId, ownershipStatus: "EXPLICIT_PERMISSION", authorizationReference: form.authorizationReference, authorizationVerified: false,
      deliveryMethod: "AUTHORIZED_P2P", sourceType: form.manifestUrl ? "WEBTORRENT" : "TORRENT_METADATA", manifestUrl: form.manifestUrl || undefined,
      infoHash: form.infoHash || undefined, durationSeconds: Number(form.durationSeconds), languages: ["en"], subtitles: [], status: "DRAFT",
    }) });
    const data = await response.json() as { error?: string }; setMessage(response.ok ? "Authorized source draft registered. Verify the rights and metadata before enabling it." : data.error ?? "Source registration failed."); if (response.ok) void load();
  };

  const saveConfig = async (next: Config) => {
    setMessage("");
    const response = await fetch("/api/lab/p2p/config", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next, maxTransferBytes: next.maxTransferBytes ?? null, peerUploadEnabled: false }) });
    if (response.ok) { setConfig(await response.json() as Config); setMessage("Experiment configuration saved."); } else setMessage((await response.json() as { error?: string }).error ?? "Configuration update failed.");
  };

  const toggleConfig = async (field: "enabled" | "adminEnabled" | "browserEnabled" | "diagnosticsEnabled" | "fallbackEnabled") => {
    if (!config) return;
    await saveConfig({ ...config, [field]: !config[field] });
  };

  const verify = async (source: Source) => {
    const response = await fetch(`/api/lab/p2p/sources/${source.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...source, authorizationVerified: true, status: "AVAILABLE" }) });
    setMessage(response.ok ? "Source marked verified and available. Use this only after checking the authorization evidence and media metadata." : (await response.json() as { error?: string }).error ?? "Verification failed."); if (response.ok) void load();
  };

  const disable = async (source: Source) => {
    const response = await fetch(`/api/lab/p2p/sources/${source.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Source disabled." : (await response.json() as { error?: string }).error ?? "Disable failed."); if (response.ok) void load();
  };

  const cards = overview ? [["Experimental titles", overview.totalTitles], ["Available / degraded", `${overview.sources.AVAILABLE ?? 0} / ${overview.sources.DEGRADED ?? 0}`], ["Unavailable / unsupported", `${overview.sources.UNAVAILABLE ?? 0} / ${overview.sources.UNSUPPORTED ?? 0}`], ["Playback attempts", overview.attempts], ["Successful starts", overview.successful], ["Median first frame", overview.medianTimeToFirstFrameMs === null ? "—" : `${overview.medianTimeToFirstFrameMs} ms`], ["Failure rate", `${Math.round(overview.failureRate * 100)}%`], ["Fallback rate", `${Math.round(overview.fallbackRate * 100)}%`], ["Estimated origin bytes avoided", overview.measuredBytesFromPeers ? `${overview.measuredBytesFromPeers.toLocaleString()} B` : "Not measurable yet"]] : [];
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow"><FlaskConical size={14}/> Controlled experiment</p><h1 className="font-display text-4xl">ORUN P2P Lab</h1></div><a href="/api/lab/p2p/diagnostics/export" className="glass-action"><Download size={17}/>Export diagnostics CSV</a></div>
    {message && <p className="mt-5 rounded-xl border border-amber/20 bg-amber/10 p-4 text-sm text-amber">{message}</p>}
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-sm text-white/45">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article>)}</section>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="font-display text-xl">Experiment configuration</h2><div className="mt-5 space-y-4">{config && <>{(["enabled", "adminEnabled", "browserEnabled", "diagnosticsEnabled", "fallbackEnabled"] as const).map((field) => <label key={field} className="flex items-center justify-between gap-4 text-sm"><span>{field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</span><input type="checkbox" checked={Boolean(config[field])} onChange={() => void toggleConfig(field)} /></label>)}<label className="block text-sm">Startup timeout (ms)<input className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b121c] p-3" type="number" min={5000} max={120000} value={config.startupTimeoutMs} onChange={(e) => setConfig({ ...config, startupTimeoutMs: Number(e.target.value) })}/></label><label className="block text-sm">Maximum playback duration (seconds)<input className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b121c] p-3" type="number" min={60} max={43200} value={config.maxPlaybackDurationSeconds} onChange={(e) => setConfig({ ...config, maxPlaybackDurationSeconds: Number(e.target.value) })}/></label><label className="block text-sm">Diagnostics retention (days)<input className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b121c] p-3" type="number" min={1} max={365} value={config.diagnosticsRetentionDays} onChange={(e) => setConfig({ ...config, diagnosticsRetentionDays: Number(e.target.value) })}/></label><fieldset><legend className="text-sm">Permitted source types</legend>{(["WEBTORRENT", "TORRENT_METADATA"] as const).map((type) => <label key={type} className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={config.permittedSourceTypes.includes(type)} onChange={(e) => setConfig({ ...config, permittedSourceTypes: e.target.checked ? [...config.permittedSourceTypes, type] : config.permittedSourceTypes.filter((item) => item !== type) })}/>{type}</label>)}</fieldset><button className="glass-action" onClick={() => void saveConfig(config)}>Save configuration</button></>}<p className="text-xs leading-5 text-white/40">Peer uploading remains disabled and cannot be enabled by this interface.</p></div></section>
      <section className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="font-display text-xl">Register authorized source</h2><div className="mt-5 grid gap-3"><input className="rounded-xl border border-white/10 bg-[#0b121c] p-3" placeholder="Existing ORUN film ID" value={form.filmId} onChange={(e) => setForm({ ...form, filmId: e.target.value })}/><input className="rounded-xl border border-white/10 bg-[#0b121c] p-3" placeholder="Authorization reference" value={form.authorizationReference} onChange={(e) => setForm({ ...form, authorizationReference: e.target.value })}/><input className="rounded-xl border border-white/10 bg-[#0b121c] p-3" placeholder="HTTPS .torrent metadata URL (optional)" value={form.manifestUrl} onChange={(e) => setForm({ ...form, manifestUrl: e.target.value })}/><input className="rounded-xl border border-white/10 bg-[#0b121c] p-3" placeholder="40/64 character info hash (optional)" value={form.infoHash} onChange={(e) => setForm({ ...form, infoHash: e.target.value })}/><button className="primary-action" onClick={() => void createSource()}><Plus size={17}/>Create disabled draft</button></div></section>
    </div>
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/40">Source management</p><h2 className="font-display text-xl">Authorized catalog</h2></div><button aria-label="Refresh sources" onClick={() => void load()}><RefreshCcw/></button></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-white/35"><tr><th className="py-3">Film</th><th>Status</th><th>Rights</th><th>Type</th><th></th></tr></thead><tbody>{sources.map((source) => <tr key={source.id} className="border-t border-white/8"><td className="py-4">{source.titleSnapshot}</td><td>{source.status}</td><td>{source.authorizationVerified ? <span className="inline-flex items-center gap-2 text-emerald-400"><ShieldCheck size={15}/>Verified</span> : "Pending"}</td><td>{source.sourceType}</td><td className="flex justify-end gap-2 py-3">{!source.authorizationVerified && <button className="glass-action" onClick={() => void verify(source)}>Verify & enable</button>}<button className="glass-action" onClick={() => void disable(source)}>Disable</button></td></tr>)}</tbody></table></div></section>
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6"><p className="text-sm text-white/40">Diagnostics</p><h2 className="font-display text-xl">Recent sessions</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-xs"><thead className="text-white/35"><tr><th className="py-3">Session</th><th>Content</th><th>Method</th><th>Browser / device</th><th>Source</th><th>First frame</th><th>Playback / buffering</th><th>Failure</th><th>Fallback</th></tr></thead><tbody>{overview?.recentSessions.map((session) => <tr key={session.id} className="border-t border-white/8"><td className="py-3">{session.id.slice(0, 10)}…</td><td>{session.filmId}</td><td>{session.deliveryMethod}</td><td>{session.browserCategory ?? "Unknown"} / {session.deviceCategory ?? "Unknown"}</td><td>{session.sourceStatus}</td><td>{session.timeToFirstFrameMs === null ? "—" : `${session.timeToFirstFrameMs} ms`}</td><td>{session.playbackDurationMs} / {session.bufferingDurationMs} ms</td><td>{session.failureCategory ?? "—"}</td><td>{session.fallbackUsed ? session.fallbackOutcome ?? "Used" : "No"}</td></tr>)}</tbody></table></div></section>
  </div>;
}
