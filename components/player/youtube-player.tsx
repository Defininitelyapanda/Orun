export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden bg-black">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`}
        title={`${title} — B28 Entertainment on YouTube`}
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
