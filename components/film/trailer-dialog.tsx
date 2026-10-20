"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";

function youtubeId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=))([\w-]{6,})/)?.[1] ?? null;
}

export function TrailerDialog({ title, synopsis, slug, trailerUrl, lowBandwidthUrl, duration, triggerLabel="Play trailer", onOpenChange }: { title: string; synopsis: string; slug: string; trailerUrl: string; lowBandwidthUrl?: string; duration?: number; triggerLabel?:string; onOpenChange?:(open:boolean)=>void }) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [lowBundles,setLowBundles]=useState(false);
  const [playing, setPlaying] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const source = lowBundles && lowBandwidthUrl ? lowBandwidthUrl : trailerUrl;
  const ytId = youtubeId(source);

  useEffect(()=>{const task=window.setTimeout(()=>{try{setMuted(localStorage.getItem("orun_preview_muted")!=="false");setLowBundles(localStorage.getItem("orun_low_bundles_v1")==="true")}catch{/* Preferences are optional. */}},0);return()=>window.clearTimeout(task)},[]);
  function closeDialog(){setOpen(false);setPlaying(false);onOpenChange?.(false)}
  function openDialog(){setOpen(true);setPlaying(!lowBundles);onOpenChange?.(true)}
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") closeDialog(); };
    const message=(event:MessageEvent)=>{try{if(!/youtube(?:-nocookie)?\.com$/.test(new URL(event.origin).hostname))return;const data=typeof event.data==="string"?JSON.parse(event.data):event.data;if(data?.event==="onStateChange"){setPlaying(data.info===1);if(data.info===0)closeDialog()}}catch{/* Ignore unrelated frame messages. */}};
    window.addEventListener("keydown", keydown);
    window.addEventListener("message",message);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", keydown);window.removeEventListener("message",message); trigger?.focus(); };
    // Closing is intentionally centralized so media unmounts immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function command(func: string, args: unknown[] = []) { frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*"); }
  function togglePlayback() {
    if (ytId) command(playing ? "pauseVideo" : "playVideo");
    else if (videoRef.current) void (playing ? videoRef.current.pause() : videoRef.current.play());
    setPlaying(value => !value);
  }
  function toggleMute() {
    const next = !muted; setMuted(next); localStorage.setItem("orun_preview_muted", String(next));
    if (ytId) command(next ? "mute" : "unMute"); else if (videoRef.current) videoRef.current.muted = next;
  }

  return <>
    <button ref={triggerRef} type="button" onClick={openDialog} className="glass-action"><Play size={17}/>{triggerLabel}</button>
    {open && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="trailer-title" onMouseDown={event => { if (event.target === event.currentTarget) closeDialog(); }}>
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#090d14] shadow-2xl">
        <div className="relative aspect-video bg-black">
          {ytId ? <iframe ref={frameRef} className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?enablejsapi=1&autoplay=${lowBundles ? 0 : 1}&mute=${muted ? 1 : 0}&playsinline=1&rel=0`} title={`${title} trailer`} allow="autoplay; encrypted-media; picture-in-picture"/> : <video ref={videoRef} src={source} poster={undefined} className="h-full w-full object-contain" playsInline muted={muted} autoPlay={!lowBundles} preload={lowBundles ? "none" : "metadata"} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={closeDialog}/>}
          <button type="button" autoFocus onClick={closeDialog} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/70" aria-label="Close trailer"><X size={20}/></button>
          <div className="absolute bottom-3 left-3 flex gap-2"><button type="button" onClick={togglePlayback} className="grid h-10 w-10 place-items-center rounded-full bg-black/75" aria-label={playing ? "Pause trailer" : "Play trailer"}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button><button type="button" onClick={toggleMute} className="grid h-10 w-10 place-items-center rounded-full bg-black/75" aria-label={muted ? "Unmute trailer" : "Mute trailer"}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button></div>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-3"><h2 id="trailer-title" className="font-display text-2xl">{title}</h2>{duration && <span className="text-xs text-white/40">{Math.ceil(duration / 60)} min trailer</span>}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{synopsis}</p>{lowBundles && <p className="mt-2 text-xs text-amber">Low Bundles Mode: playback waits for your action and uses the lighter rendition when available.</p>}</div><Link href={`/films/${slug}`} className="primary-action shrink-0">View film</Link></div>
      </div>
    </div>}
  </>;
}
