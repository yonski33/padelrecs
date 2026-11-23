"use client";
// The in-page video player (owner 2026-11-23): a click on a review's thumbnail, play button or chapter opens the video
// over the page instead of leaving it. Nothing loads until that click (no iframe, no third-party request before it). YouTube
// plays from youtube-nocookie.com (a chapter opens at its second), TikTok in its official embed player in a vertical frame.
// Dark backdrop, closes on ✕, Esc or a backdrop click and gives focus back to what opened it; full screen at phone width.
// The "Watch on YouTube ↗" / "Watch on TikTok ↗" links stay as they are, and the overlay carries the same link, so a video
// whose maker turned embedding off still has its way out. A review marked `noEmbed` opens the original in a new tab instead.
// A ctrl/cmd/shift or middle click keeps the browser's own behaviour (new tab). Shared: wrap any list in <VideoProvider>
// and give its links playClick(...) (SkinRecs can reuse it as is).
import "./video-overlay.css";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

export type Clip = { kind: "youtube" | "tiktok"; id: string; start?: number; title: string; url: string };

/** The clip for a review's link, or null when it can't play in the page (a blog, an unknown id, embedding off). */
export function clipOf(r: { kind: string; url: string; video?: string | null; creator: string; noEmbed?: boolean }, start?: number): Clip | null {
  if (r.noEmbed) return null;
  if (r.kind === "youtube") {
    const id = r.video || r.url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1];
    return id ? { kind: "youtube", id, start, title: `${r.creator} on YouTube`, url: r.url } : null;
  }
  if (r.kind === "tiktok") {
    const id = r.url.match(/\/video\/(\d+)/)?.[1];
    return id ? { kind: "tiktok", id, title: `${r.creator} on TikTok`, url: r.url } : null;
  }
  return null;
}

export const embedSrc = (c: Clip) => c.kind === "youtube"
  ? `https://www.youtube-nocookie.com/embed/${c.id}?autoplay=1&rel=0&playsinline=1${c.start ? `&start=${Math.floor(c.start)}` : ""}`
  : `https://www.tiktok.com/player/v1/${c.id}?autoplay=1&rel=0&description=1`;

const Ctx = createContext<((c: Clip) => void) | null>(null);
export const usePlay = () => useContext(Ctx);

/** onClick for a link that opens `clip` in the overlay; a plain click only, and nothing when there is no clip or no provider. */
export function playClick(play: ((c: Clip) => void) | null, clip: Clip | null) {
  return (e: MouseEvent<HTMLElement>) => {
    if (!play || !clip || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    play(clip);
  };
}

export function VideoProvider({ children }: { children: ReactNode }) {
  const [clip, setClip] = useState<Clip | null>(null);
  const back = useRef<HTMLElement | null>(null), closeBtn = useRef<HTMLButtonElement | null>(null);
  const play = useCallback((c: Clip) => { back.current = document.activeElement as HTMLElement | null; setClip(c); }, []);
  const close = useCallback(() => { setClip(null); back.current?.focus(); }, []);
  useEffect(() => {
    if (!clip) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = overflow; };
  }, [clip, close]);
  return <Ctx.Provider value={play}>
    {children}
    {clip && <div className="vo" role="dialog" aria-modal="true" aria-label={clip.title} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={`vo-box ${clip.kind}`}>
        <div className="vo-bar">
          <a className="vo-out" href={clip.url} target="_blank" rel="noopener nofollow">{clip.kind === "youtube" ? "Watch on YouTube ↗" : "Watch on TikTok ↗"}</a>
          <button ref={closeBtn} type="button" className="vo-x" aria-label="Close video" onClick={close}>✕</button>
        </div>
        <div className="vo-frame">
          <iframe key={`${clip.id}-${clip.start ?? 0}`} src={embedSrc(clip)} title={clip.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        </div>
      </div>
    </div>}
  </Ctx.Provider>;
}
