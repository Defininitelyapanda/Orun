"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Gauge, Maximize, MonitorCog, RotateCcw, Share2, SlidersHorizontal, X } from "lucide-react";
import type { Film } from "@/server/demo/catalog";
import { formatPlaybackTime, readWatchHistory, resetWatchProgress, saveWatchProgress } from "@/lib/viewer/watch-history";

type PlayerStateEvent = { data: number };
type PlayerReadyEvent = { target: YouTubePlayerApi };
type YouTubePlayerApi = {
  destroy(): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  setPlaybackRate(rate: number): void;
  setPlaybackQuality(quality: string): void;
};
type YouTubeConstructor = new (element: HTMLElement, options: { videoId: string; playerVars: Record<string, number | string>; events: { onReady(event: PlayerReadyEvent): void; onStateChange(event: PlayerStateEvent): void } }) => YouTubePlayerApi;

declare global {
  interface Window { YT?: { Player: YouTubeConstructor }; onYouTubeIframeAPIReady?: () => void; }
}

let youtubeApiPromise: Promise<void> | undefined;
function loadYouTubeApi() {
  if (typeof window === "undefined" || window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function YouTubePlayer({ videoId, title, mediaId, filmSlug, recommendation }: { videoId: string; title: string; mediaId: string; filmSlug: string; recommendation?: Film }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerApi | undefined>(undefined);
  const lastSavedBucket = useRef(-1);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resumeAt, setResumeAt] = useState<number>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [dimming, setDimming] = useState(0);
  const [lowBundles, setLowBundles] = useState(false);
  const [endingDismissed, setEndingDismissed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    const task = window.setTimeout(() => {
      try { setLowBundles(window.localStorage.getItem("orun_low_bundles_v1") === "true"); } catch { /* local preferences are optional */ }
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadYouTubeApi().then(() => {
      if (cancelled || !mountRef.current || !window.YT?.Player) return;
      const requestLowQuality = window.localStorage.getItem("orun_low_bundles_v1") === "true";
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: { controls: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin, vq: requestLowQuality ? "small" : "default" },
        events: {
          onReady: ({ target }) => {
            const total = target.getDuration();
            setDuration(total);
            setReady(true);
            const saved = readWatchHistory()[mediaId];
            if (saved && !saved.completed && saved.positionSeconds >= 10 && saved.positionSeconds < total - 10) setResumeAt(saved.positionSeconds);
            if (requestLowQuality) target.setPlaybackQuality("small");
          },
          onStateChange: ({ data }) => setPlaying(data === 1),
        },
      });
    });
    return () => { cancelled = true; playerRef.current?.destroy(); playerRef.current = undefined; };
  }, [videoId, mediaId]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const position = player.getCurrentTime();
      const total = player.getDuration();
      setCurrentTime(position);
      if (total > 0) setDuration(total);
      const bucket = Math.floor(position / 10);
      if (playing && bucket !== lastSavedBucket.current) {
        lastSavedBucket.current = bucket;
        saveWatchProgress(mediaId, position, total);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mediaId, playing, ready]);

  const saveNow = useCallback(() => {
    const player = playerRef.current;
    if (player) saveWatchProgress(mediaId, player.getCurrentTime(), player.getDuration());
  }, [mediaId]);

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === "hidden") saveNow(); };
    const onPageHide = () => saveNow();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onPageHide); saveNow(); };
  }, [saveNow]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
      const player = playerRef.current;
      if (!player) return;
      if (event.code === "Space") { event.preventDefault(); if (playing) player.pauseVideo(); else player.playVideo(); }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); player.seekTo(Math.max(0, player.getCurrentTime() + (event.key === "ArrowRight" ? 10 : -10)), true); }
      if (event.key.toLowerCase() === "f") void shellRef.current?.requestFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playing]);

  const selectSpeed = (value: number) => { playerRef.current?.setPlaybackRate(value); setSpeed(value); };
  const toggleLowBundles = () => {
    const next = !lowBundles;
    setLowBundles(next);
    try { window.localStorage.setItem("orun_low_bundles_v1", String(next)); } catch { /* local preferences are optional */ }
    playerRef.current?.setPlaybackQuality(next ? "small" : "default");
  };
  const share = async () => {
    const data = { title: `${title} on ORUN`, text: `Watch ${title} on ORUN`, url: `${window.location.origin}/films/${filmSlug}` };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(window.location.href); setShareStatus("Link copied"); }
    } catch (error) { if ((error as Error).name !== "AbortError") setShareStatus("Sharing is unavailable"); }
  };
  const showEnding = Boolean(recommendation && duration > 0 && duration - currentTime <= 15 && duration - currentTime > 0 && !endingDismissed);

  return <div ref={shellRef} className="relative aspect-video w-full overflow-hidden bg-black" aria-label={`${title} player`}>
    <div className="absolute inset-0" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}><div ref={mountRef} className="h-full w-full" /></div>
    <div className="pointer-events-none absolute inset-0 z-10 bg-black" style={{ opacity: dimming / 100 }} />
    <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2 md:left-5 md:top-5">
      <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/75 px-4 text-xs font-semibold text-white shadow-xl backdrop-blur-md hover:bg-black/90" aria-expanded={settingsOpen}><SlidersHorizontal size={16} /> Viewer settings</button>
      <button type="button" onClick={share} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/75 text-white backdrop-blur-md hover:bg-black/90" aria-label="Share this film"><Share2 size={17} /></button>
      {shareStatus && <span className="self-center rounded-full bg-black/75 px-3 py-2 text-xs text-white">{shareStatus}</span>}
    </div>
    <button type="button" onClick={() => void shellRef.current?.requestFullscreen()} className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/75 text-white backdrop-blur-md hover:bg-black/90 md:right-5 md:top-5" aria-label="Enter fullscreen"><Maximize size={18} /></button>

    {resumeAt !== undefined && <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b111b] p-6 text-center shadow-2xl"><p className="eyebrow justify-center">Saved on this device</p><h2 className="font-display text-2xl">Continue watching?</h2><p className="mt-2 text-sm text-white/55">Resume {title} from {formatPlaybackTime(resumeAt)}.</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><button type="button" className="primary-action" onClick={() => { playerRef.current?.seekTo(resumeAt, true); playerRef.current?.playVideo(); setResumeAt(undefined); }}><Check size={17} /> Continue</button><button type="button" className="glass-action" onClick={() => { resetWatchProgress(mediaId); playerRef.current?.seekTo(0, true); playerRef.current?.playVideo(); setResumeAt(undefined); }}><RotateCcw size={17} /> Start over</button></div></div></div>}

    {settingsOpen && <aside className="absolute inset-y-0 left-0 z-30 w-full max-w-sm overflow-y-auto border-r border-white/10 bg-[#070b12]/95 p-5 pb-20 shadow-2xl backdrop-blur-xl" aria-label="Player display settings"><div className="flex items-center justify-between"><div><p className="eyebrow"><MonitorCog size={14} /> Playback</p><h2 className="font-display text-2xl">Viewer settings</h2></div><button type="button" onClick={() => setSettingsOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Close settings"><X size={19} /></button></div>
      <div className="mt-7 space-y-6">
        <div><div className="flex justify-between text-sm"><label htmlFor="brightness">Brightness</label><span className="text-white/45">{brightness}%</span></div><input id="brightness" className="mt-3 w-full accent-[#d69a3a]" type="range" min="50" max="150" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} /></div>
        <div><div className="flex justify-between text-sm"><label htmlFor="contrast">Contrast</label><span className="text-white/45">{contrast}%</span></div><input id="contrast" className="mt-3 w-full accent-[#d69a3a]" type="range" min="50" max="150" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /></div>
        <div><div className="flex justify-between text-sm"><label htmlFor="dimming">Screen dimming</label><span className="text-white/45">{dimming}%</span></div><input id="dimming" className="mt-3 w-full accent-[#d69a3a]" type="range" min="0" max="70" value={dimming} onChange={(event) => setDimming(Number(event.target.value))} /></div>
        <div><p className="mb-3 text-sm">Playback speed</p><div className="grid grid-cols-4 gap-2">{speeds.map((value) => <button type="button" key={value} onClick={() => selectSpeed(value)} className={`min-h-10 rounded-lg border text-xs font-semibold ${speed === value ? "border-amber bg-amber text-black" : "border-white/10 bg-white/5 text-white"}`}>{value}×</button>)}</div></div>
        <button type="button" onClick={toggleLowBundles} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left ${lowBundles ? "border-amber/60 bg-amber/10" : "border-white/10 bg-white/5"}`}><span><strong className="block text-sm">Low Bundles Mode</strong><small className="text-white/45">Requests YouTube&apos;s lowest adaptive quality</small></span><span className={`h-6 w-11 rounded-full p-1 ${lowBundles ? "bg-amber" : "bg-white/15"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${lowBundles ? "translate-x-5" : ""}`} /></span></button>
        <div className="rounded-xl border border-white/10 bg-white/[.035] p-4 text-xs leading-5 text-white/50"><p className="flex items-center gap-2 font-semibold text-white"><Gauge size={15} className="text-amber" /> Adaptive quality · external host</p><p className="mt-2">YouTube selects available quality, captions, and audio tracks for this temporary catalogue. ORUN cannot measure transferred bytes or guarantee a requested rendition.</p></div>
        <button type="button" className="min-h-11 w-full rounded-full border border-white/15 text-sm font-semibold hover:bg-white/10" onClick={() => { setBrightness(100); setContrast(100); setDimming(0); selectSpeed(1); }}>Reset display defaults</button>
      </div>
    </aside>}

    {showEnding && recommendation && <div className="absolute bottom-16 right-4 z-30 w-[min(88vw,360px)] rounded-2xl border border-white/10 bg-[#0b111b]/95 p-4 shadow-2xl backdrop-blur-xl"><button type="button" onClick={() => setEndingDismissed(true)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/40" aria-label="Dismiss recommendation"><X size={16} /></button><p className="eyebrow">Up next for you</p><div className="mt-3 flex gap-3"><div className="h-24 w-16 flex-none rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${recommendation.posterUrl})` }} /><div className="pr-6"><h2 className="font-display text-lg">{recommendation.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">{recommendation.synopsis}</p><Link href={`/films/${recommendation.slug}`} className="mt-3 inline-flex text-xs font-bold text-amber hover:underline">View film</Link></div></div></div>}
  </div>;
}
