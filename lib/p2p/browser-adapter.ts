import type { P2PAvailability, P2PPlaybackAdapter, P2PSource, PlaybackSessionResult } from "./types";

export interface AuthorizedBrowserP2PEngine {
  check(source: P2PSource): Promise<P2PAvailability>;
  start(source: P2PSource): Promise<PlaybackSessionResult>;
  stop(sessionId: string): Promise<void>;
}

export class BrowserP2PAdapter implements P2PPlaybackAdapter {
  constructor(private readonly engine?: AuthorizedBrowserP2PEngine, private readonly browserSupportsWebRTC = typeof RTCPeerConnection !== "undefined") {}

  async checkAvailability(source: P2PSource): Promise<P2PAvailability> {
    if (!this.browserSupportsWebRTC) return { status: "UNSUPPORTED", estimatedPlayable: false, reason: "This browser does not expose the WebRTC APIs required for peer connections." };
    if (!source.manifestUrl && !source.infoHash) return { status: "UNSUPPORTED", estimatedPlayable: false, reason: "The authorized source metadata is incomplete." };
    if (!this.engine) return { status: "UNSUPPORTED", estimatedPlayable: false, reason: "No approved browser P2P engine is configured. Magnet links and torrent metadata are not natively playable video URLs." };
    return this.engine.check(source);
  }

  async createPlaybackSession(source: P2PSource): Promise<PlaybackSessionResult> {
    const availability = await this.checkAvailability(source);
    if (!this.engine || availability.status === "UNSUPPORTED" || availability.status === "UNAVAILABLE") return { sessionId: crypto.randomUUID(), status: availability.status === "UNAVAILABLE" ? "UNAVAILABLE" : "UNSUPPORTED", availability };
    return this.engine.start(source);
  }

  async stopPlayback(sessionId: string): Promise<void> { await this.engine?.stop(sessionId); }
}
