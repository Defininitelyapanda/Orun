"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Heart, LockKeyhole, MessageCircle, Pencil, Send, Star, Trash2, X } from "lucide-react";

type PublicComment = { id: string; body: string; createdAt: string; helpful: number; creatorReply: boolean; own:boolean; author: { name: string; avatarUrl?: string | null }; replies: Array<{ id: string; body: string; createdAt: string; creatorReply: boolean }> };
type RatingSummary = { average: number; count: number; ownRating: number | null; distribution: Record<string, number>; enabled?:boolean };

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error === "AUTH_REQUIRED" ? "Sign in to participate." : payload.error ?? "Something went wrong.");
  return payload as T;
}

export function FilmFeedback({ slug, privateMessagesEnabled = true }: { slug: string; privateMessagesEnabled?: boolean }) {
  const [sort, setSort] = useState("newest");
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [notice, setNotice] = useState("");
  const [rating, setRating] = useState<RatingSummary>({ average: 0, count: 0, ownRating: null, distribution: {} });
  const [draftRating, setDraftRating] = useState(0);
  const [commentCount,setCommentCount]=useState(0);
  const [commentsEnabled,setCommentsEnabled]=useState(true);
  const [editing,setEditing]=useState<{id:string;body:string}|null>(null);

  const loadComments = useCallback(async (nextPage = 1) => {
    try {
      const data = await readJson<{ items: PublicComment[]; hasMore: boolean; total:number; enabled?:boolean }>(await fetch(`/api/films/${encodeURIComponent(slug)}/comments?sort=${sort}&page=${nextPage}`));
      setComments((current) => nextPage === 1 ? data.items : [...current, ...data.items]);
      setPage(nextPage);
      setHasMore(data.hasMore);
      setCommentCount(data.total);
      setCommentsEnabled(data.enabled!==false);
    } catch { setComments([]); }
  }, [slug, sort]);

  const loadRating = useCallback(async () => {
    try {
      const data = await readJson<RatingSummary>(await fetch(`/api/films/${encodeURIComponent(slug)}/rating`));
      setRating(data);
      setDraftRating(data.ownRating ?? 0);
    } catch { /* A missing database should not break the detail page. */ }
  }, [slug]);

  useEffect(() => { const task=window.setTimeout(() => void loadComments(),0); return()=>window.clearTimeout(task); }, [loadComments]);
  useEffect(() => { const task=window.setTimeout(() => void loadRating(),0); return()=>window.clearTimeout(task); }, [loadRating]);

  async function postComment(event: FormEvent) {
    event.preventDefault(); setNotice("");
    try {
      await readJson(await fetch(`/api/films/${encodeURIComponent(slug)}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) }));
      setBody(""); setNotice("Your review is now public."); await loadComments();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to post."); }
  }

  async function submitRating() {
    setNotice("");
    try {
      await readJson(await fetch(`/api/films/${encodeURIComponent(slug)}/rating`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: draftRating }) }));
      setNotice("Your rating has been saved."); await loadRating();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to rate."); }
  }

  async function removeRating() {
    try {
      await readJson(await fetch(`/api/films/${encodeURIComponent(slug)}/rating`, { method: "DELETE" }));
      setDraftRating(0); setNotice("Your rating was removed."); await loadRating();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to remove rating."); }
  }

  async function sendPrivateMessage(event: FormEvent) {
    event.preventDefault(); setNotice("");
    try {
      await readJson(await fetch(`/api/films/${encodeURIComponent(slug)}/message-creator`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: message }) }));
      setMessage(""); setShowMessage(false); setNotice("Private message sent to the authorized creator account.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to send message."); }
  }

  async function saveEdit(){if(!editing)return;try{await readJson(await fetch(`/api/comments/${editing.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({body:editing.body})}));setEditing(null);setNotice("Comment updated.");await loadComments()}catch(error){setNotice(error instanceof Error?error.message:"Unable to edit comment.")}}
  async function deleteComment(id:string){try{const response=await fetch(`/api/comments/${id}`,{method:"DELETE"});if(!response.ok)await readJson(response);setNotice("Comment deleted.");await loadComments()}catch(error){setNotice(error instanceof Error?error.message:"Unable to delete comment.")}}

  return <section id="comments" className="rounded-3xl border border-white/10 bg-white/[.035] p-5 md:p-8" aria-labelledby="discussion-title">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
      <div><p className="eyebrow"><MessageCircle size={14}/> Film community</p><h2 id="discussion-title" className="font-display text-3xl">Comments &amp; Reviews <span className="font-sans text-base text-white/35">({commentCount})</span></h2><p className="mt-2 text-sm text-white/50">Public discussion is visible to everyone. Private messages are never posted here.</p></div>
      <div className="rounded-2xl border border-amber/20 bg-amber/5 p-4 md:min-w-72">
        <div className="flex items-end gap-3"><strong className="font-display text-3xl text-amber">{rating.count ? rating.average.toFixed(1) : "—"}</strong><span className="pb-1 text-sm text-white/45">{rating.count ? `/ 5 · ${rating.count} rating${rating.count === 1 ? "" : "s"}` : "Not Yet Rated"}</span></div>
        {rating.enabled!==false?<><div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rate this film from one to five stars">{[1,2,3,4,5].map(value => <button key={value} type="button" role="radio" aria-checked={draftRating === value} aria-label={`${value} star${value === 1 ? "" : "s"}`} onClick={() => setDraftRating(value)} className="rounded p-1 text-amber hover:bg-white/10"><Star size={23} fill={value <= draftRating ? "currentColor" : "none"}/></button>)}</div><div className="mt-3 flex gap-2"><button type="button" disabled={!draftRating} onClick={submitRating} className="rounded-full bg-amber px-4 py-2 text-xs font-bold text-black disabled:opacity-40">{rating.ownRating ? "Update rating" : "Submit rating"}</button>{rating.ownRating && <button type="button" onClick={removeRating} className="rounded-full border border-white/10 p-2 text-white/60" aria-label="Remove my rating"><Trash2 size={15}/></button>}</div></>:<p className="mt-3 text-xs text-white/40">Ratings are disabled for this title.</p>}
      </div>
    </div>

    {notice && <p role="status" className="mt-5 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-amber">{notice} {notice.startsWith("Sign in") && <Link className="underline" href="/auth/login">Sign in</Link>}</p>}

    {commentsEnabled?<form onSubmit={postComment} className="mt-7">
      <label htmlFor="public-review" className="text-sm font-semibold">Share a public review</label>
      <textarea id="public-review" required minLength={2} maxLength={2000} value={body} onChange={event => setBody(event.target.value)} placeholder="What stayed with you about this film?" className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-sm placeholder:text-white/30"/>
      <div className="mt-3 flex flex-wrap items-center gap-3"><button className="primary-action" type="submit"><Send size={16}/>Post comment</button><button type="button" disabled={!privateMessagesEnabled} onClick={() => setShowMessage(value => !value)} className="glass-action disabled:cursor-not-allowed disabled:opacity-45"><LockKeyhole size={16}/>{privateMessagesEnabled ? "Message Creator" : "Private messages disabled"}</button></div>
    </form>:<p className="mt-7 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">Public comments are disabled for this title.</p>}

    {showMessage && <form onSubmit={sendPrivateMessage} className="mt-4 rounded-2xl border border-amber/20 bg-[#0a111b] p-4"><label htmlFor="private-message" className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole size={15} className="text-amber"/>Private message to the authorized uploader</label><p className="mt-1 text-xs text-white/40">Only you, the recipient, and authorized safety moderators can access this conversation.</p><textarea id="private-message" required minLength={2} maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"/><button type="submit" className="mt-3 rounded-full bg-amber px-4 py-2 text-sm font-bold text-black">Send privately</button></form>}

    <div className="mt-10 flex items-center justify-between border-b border-white/10 pb-4"><h3 className="font-display text-xl">Audience discussion</h3><select value={sort} onChange={event => setSort(event.target.value)} className="rounded-full border border-white/10 bg-[#0b121c] px-3 py-2 text-xs" aria-label="Sort comments"><option value="newest">Newest</option><option value="helpful">Most Helpful</option><option value="creator">Creator Replies</option></select></div>
    <div className="divide-y divide-white/10">{comments.length ? comments.filter(comment => sort !== "creator" || comment.replies.some(reply => reply.creatorReply)).map(comment => <article key={comment.id} className="py-6"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber/15 text-sm font-bold text-amber">{comment.author.name.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-2"><strong className="text-sm">{comment.author.name}</strong><time className="text-xs text-white/35">{new Date(comment.createdAt).toLocaleDateString()}</time></div>{editing?.id===comment.id?<div className="mt-3"><textarea maxLength={2000} value={editing.body} onChange={event=>setEditing({...editing,body:event.target.value})} className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"/><div className="mt-2 flex gap-2"><button type="button" onClick={()=>void saveEdit()} className="rounded-full bg-amber px-3 py-1.5 text-xs font-bold text-black">Save</button><button type="button" onClick={()=>setEditing(null)} className="rounded-full border border-white/10 p-2" aria-label="Cancel edit"><X size={13}/></button></div></div>:<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/70">{comment.body}</p>}<div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40"><button onClick={() => void fetch(`/api/comments/${comment.id}/helpful`, { method: "POST" })} className="flex items-center gap-1 hover:text-amber"><Heart size={14}/>Helpful {comment.helpful || ""}</button>{comment.own?<><button onClick={()=>setEditing({id:comment.id,body:comment.body})} className="flex items-center gap-1 hover:text-white"><Pencil size={13}/>Edit</button><button onClick={()=>void deleteComment(comment.id)} className="flex items-center gap-1 hover:text-red-300"><Trash2 size={13}/>Delete</button></>:<button onClick={() => void fetch(`/api/comments/${comment.id}/report`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "Viewer report" }) })} className="flex items-center gap-1 hover:text-white"><Flag size={13}/>Report</button>}</div>{comment.replies.map(reply => <div key={reply.id} className="mt-4 rounded-xl border-l-2 border-amber bg-white/[.035] p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber">Creator reply</p><p className="mt-2 text-sm leading-6 text-white/65">{reply.body}</p></div>)}</div></div></article>) : <p className="py-10 text-center text-sm text-white/40">{commentsEnabled?"No public reviews yet. Start the conversation.":"Discussion is unavailable."}</p>}</div>
    {hasMore && <button type="button" onClick={() => void loadComments(page + 1)} className="mt-4 w-full rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:text-white">Load more comments</button>}
  </section>;
}
