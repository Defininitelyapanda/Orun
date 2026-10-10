"use client";

import Link from "next/link";
import { AlertTriangle, FlaskConical, Radio, RefreshCcw, ShieldCheck, Users, WifiOff, X } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { BrowserP2PAdapter } from "@/lib/p2p/browser-adapter";
import { initialP2PPlayerState, transitionP2PState } from "@/lib/p2p/state-machine";
import type { P2PAvailability, P2PSource } from "@/lib/p2p/types";

type LabConfig = { enabled: boolean; browserEnabled: boolean; diagnosticsEnabled: boolean; startupTimeoutMs: number; fallbackEnabled: boolean; maxPlaybackDurationSeconds: number; peerUploadEnabled: boolean };
type Profile = { id: string; name: string; isKids: boolean };
type SessionResponse = { sessionId: string; source: P2PSource & { id: string }; startupTimeoutMs: number; maxPlaybackDurationSeconds?: number; fallbackUrl?: string };

export function P2PLabPlayer({ contentId, title }: { contentId: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adapterRef = useRef(new BrowserP2PAdapter());
  const startupRef = useRef<number>(0);
  const bufferingStartedRef = useRef<number | null>(null);
  const firstFrameRecordedRef = useRef(false);
  const lastProgressRef = useRef(0);
  const durationTimerRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(transitionP2PState, initialP2PPlayerState);
  const [config, setConfig] = useState<LabConfig | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [availability, setAvailability] = useState<P2PAvailability>({ status: "UNKNOWN" });

  useEffect(() => {
    void Promise.all([fetch("/api/lab/p2p/config", { cache: "no-store" }), fetch("/api/lab/p2p/me", { cache: "no-store" })]).then(async ([configResponse, meResponse]) => {
      if (configResponse.ok) setConfig(await configResponse.json());
      if (meResponse.ok) { const data = await meResponse.json() as { profiles: Profile[] }; setProfiles(data.profiles); setProfileId(data.profiles[0]?.id ?? ""); }
    });
  }, []);

  const record = async (type: string, extra: Record<string, unknown> = {}, explicitSessionId?: string) => {
    const sessionId = explicitSessionId ?? session?.sessionId;
    if (!sessionId || !config?.diagnosticsEnabled) return;
    await fetch("/api/lab/p2p/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, type, ...extra }) });
  };

  const fail = async (failure: "UNSUPPORTED_BROWSER" | "SOURCE_UNAVAILABLE" | "STARTUP_TIMEOUT" | "PLAYBACK_FAILED", message: string, explicitSessionId?: string) => {
    dispatch({ type: "FAIL", failure, message });
    await record("FAILED", { failureCategory: failure }, explicitSessionId);
  };

  const start = async (startedAt: number) => {
    let createdSessionId: string | undefined;
    dispatch({ type: "CHECK" }); setAvailability({ status: "CHECKING" }); startupRef.current = startedAt; firstFrameRecordedRef.current = false; lastProgressRef.current = 0;
    try {
      const response = await fetch("/api/lab/p2p/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contentId, profileId, consent, privacy: { allowP2P: consent, allowPeerUpload: false } }) });
      const data = await response.json() as SessionResponse & { error?: string; code?: string; fallbackUrl?: string };
      if (!response.ok) { if (data.fallbackUrl) setSession({ sessionId: "", source: { id: "", contentId, sourceType: "TORRENT_METADATA" }, startupTimeoutMs: config?.startupTimeoutMs ?? 20_000, fallbackUrl: data.fallbackUrl }); await fail(data.code === "SOURCE_UNAVAILABLE" ? "SOURCE_UNAVAILABLE" : "PLAYBACK_FAILED", data.error ?? "The experiment could not start."); return; }
      createdSessionId = data.sessionId;
      setSession(data);
      const source: P2PSource = { contentId, sourceType: data.source.sourceType, manifestUrl: data.source.manifestUrl, infoHash: data.source.infoHash, fileIndex: data.source.fileIndex, fileName: data.source.fileName, expectedSizeBytes: data.source.expectedSizeBytes };
      const result = await Promise.race([
        adapterRef.current.createPlaybackSession(source),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("STARTUP_TIMEOUT")), data.startupTimeoutMs)),
      ]);
      setAvailability(result.availability);
      if (result.status === "UNSUPPORTED") { await fail("UNSUPPORTED_BROWSER", result.availability.reason ?? "This source is not supported in this browser.", data.sessionId); return; }
      if (result.status === "UNAVAILABLE") { await fail("SOURCE_UNAVAILABLE", result.availability.reason ?? "The source is currently unavailable.", data.sessionId); return; }
      if (result.mediaUrl && videoRef.current) {
        videoRef.current.src = result.mediaUrl; dispatch({ type: "READY" }); await record("READY", { peerCount: result.availability.peerCount }, data.sessionId);
        if (data.maxPlaybackDurationSeconds) durationTimerRef.current = window.setTimeout(() => void cancel(), data.maxPlaybackDurationSeconds * 1000);
      }
    } catch (error) { await fail(error instanceof Error && error.message === "STARTUP_TIMEOUT" ? "STARTUP_TIMEOUT" : "PLAYBACK_FAILED", error instanceof Error && error.message === "STARTUP_TIMEOUT" ? "Experimental playback did not become ready before the configured timeout." : "Experimental playback failed to initialize.", createdSessionId); }
  };

  const cancel = async () => {
    if (durationTimerRef.current) window.clearTimeout(durationTimerRef.current);
    if (session?.sessionId) await fetch(`/api/lab/p2p/sessions/${session.sessionId}/cancel`, { method: "POST" });
    if (session?.sessionId) await adapterRef.current.stopPlayback(session.sessionId);
    dispatch({ type: "CANCEL" });
  };

  const disabled = config && (!config.enabled || !config.browserEnabled);
  return <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(13,39,71,.8),transparent_45%),#05070b] px-4 py-8 md:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow"><FlaskConical size={14}/> ORUN P2P Lab</p><h1 className="font-display text-3xl md:text-5xl">{title}</h1></div><span className="rounded-full border border-amber/30 bg-amber/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber">Experimental mode</span></header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
          <div className="relative aspect-video">
            <video ref={videoRef} controls playsInline preload="metadata" className="h-full w-full" poster="/images/orun-hero.png" aria-label={`${title} experimental playback`}
              onWaiting={(event) => { bufferingStartedRef.current = event.timeStamp; dispatch({ type: "BUFFER" }); void record("BUFFERING_STARTED"); }}
              onPlaying={(event) => { dispatch({ type: "PLAY" }); if (!firstFrameRecordedRef.current) { firstFrameRecordedRef.current = true; void record("FIRST_FRAME", { durationMs: Math.round(event.timeStamp - startupRef.current) }); } if (bufferingStartedRef.current !== null) { void record("BUFFERING_ENDED", { durationMs: Math.round(event.timeStamp - bufferingStartedRef.current) }); bufferingStartedRef.current = null; } }}
              onTimeUpdate={(event) => { const durationMs = Math.round(event.currentTarget.currentTime * 1000); if (durationMs - lastProgressRef.current >= 10_000) { lastProgressRef.current = durationMs; void record("PROGRESS", { durationMs }); } }}
              onEnded={() => { dispatch({ type: "COMPLETE" }); void record("COMPLETED"); }}
              onError={() => void fail("PLAYBACK_FAILED", "The browser could not decode or play the experimental stream.")}/>
            {state.state !== "PLAYING" && state.state !== "BUFFERING" && <div className="absolute inset-0 grid place-items-center bg-black/55 p-6 text-center"><div className="max-w-xl">
              {state.state === "IDLE" ? <Radio className="mx-auto text-amber" size={42}/> : state.state === "CHECKING" ? <RefreshCcw className="mx-auto animate-spin text-amber" size={42}/> : <WifiOff className="mx-auto text-amber" size={42}/>}
              <h2 className="mt-4 font-display text-2xl">{state.state === "IDLE" ? "Peer-assisted playback is opt-in" : state.state === "CHECKING" ? "Checking the authorized source" : state.message ?? state.state}</h2>
              {state.state === "IDLE" && <p className="mt-3 text-sm leading-6 text-white/65">P2P connections can reveal network information to other authorized participants. ORUN does not promise anonymity. Uploading is disabled in this prototype.</p>}
              {state.state === "IDLE" && <div className="mt-6 space-y-4"><select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="w-full rounded-xl border border-white/15 bg-[#0b121c] p-3" aria-label="Viewer profile"><option value="">Select a profile</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}{profile.isKids ? " (Kids)" : ""}</option>)}</select><label className="flex items-start gap-3 text-left text-sm text-white/70"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1"/>I understand the network disclosure and permit P2P connections for this session.</label><button onClick={(event) => void start(event.timeStamp)} disabled={!consent || !profileId || Boolean(disabled)} className="primary-action w-full disabled:cursor-not-allowed disabled:opacity-40">Attempt experimental playback</button></div>}
              {(state.state === "FAILED" || state.state === "CANCELLED") && <div className="mt-6 flex flex-wrap justify-center gap-3"><button className="glass-action" onClick={(event) => void start(event.timeStamp)}><RefreshCcw size={17}/>Retry</button>{session?.fallbackUrl && <Link className="primary-action" href={session.fallbackUrl} onClick={() => { dispatch({ type: "FALLBACK" }); void record("FALLBACK"); }}>Use standard ORUN player</Link>}</div>}
            </div></div>}
          </div>
        </section>
        <aside className="space-y-4">
          {disabled && <div className="rounded-2xl border border-amber/25 bg-amber/10 p-5 text-sm"><AlertTriangle className="mb-3 text-amber"/><strong>P2P Lab is disabled.</strong><p className="mt-2 text-white/60">Standard ORUN playback is unaffected.</p></div>}
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5 backdrop-blur-xl"><p className="text-xs uppercase tracking-widest text-white/40">Session status</p><p className="mt-2 text-xl font-semibold">{state.state}</p><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-white/45">Source</dt><dd>{availability.status}</dd></div>{availability.peerCount !== undefined && <div className="flex justify-between"><dt className="flex items-center gap-2 text-white/45"><Users size={15}/>Peers</dt><dd>{availability.peerCount}</dd></div>}{availability.progress !== undefined && <div><div className="flex justify-between"><dt className="text-white/45">Verified progress</dt><dd>{Math.round(availability.progress * 100)}%</dd></div><progress className="mt-2 w-full" max={1} value={availability.progress}/></div>}</dl></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5 text-sm text-white/60"><ShieldCheck className="mb-3 text-amber"/><p>Only administrator-verified, authorized media is eligible. Peer uploading is disabled by default and is not implemented in this prototype.</p></div>
          <button onClick={() => void cancel()} disabled={state.state === "IDLE" || state.state === "CANCELLED"} className="glass-action w-full disabled:opacity-40"><X size={17}/>Cancel immediately</button>
          <Link href={`/watch/${contentId}`} className="glass-action w-full">Return to standard ORUN player</Link>
        </aside>
      </div>
    </div>
  </main>;
}
