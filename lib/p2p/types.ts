export type DeliveryMethod = "ORIGIN_HLS" | "AUTHORIZED_P2P" | "EXPERIMENTAL_SOURCE";

export interface P2PSource {
  contentId: string;
  sourceType: "WEBTORRENT" | "TORRENT_METADATA";
  manifestUrl?: string;
  infoHash?: string;
  fileIndex?: number;
  fileName?: string;
  expectedSizeBytes?: number;
}

export interface P2PAvailability {
  status: "UNKNOWN" | "CHECKING" | "AVAILABLE" | "DEGRADED" | "UNAVAILABLE" | "UNSUPPORTED";
  peerCount?: number;
  progress?: number;
  estimatedPlayable?: boolean;
  reason?: string;
}

export type P2PFailureCategory =
  | "NO_PEERS"
  | "SOURCE_UNAVAILABLE"
  | "UNSUPPORTED_CODEC"
  | "UNSUPPORTED_BROWSER"
  | "NETWORK_RESTRICTED"
  | "SOURCE_INVALID"
  | "PLAYBACK_FAILED"
  | "USER_CANCELLED"
  | "STARTUP_TIMEOUT";

export type P2PDiagnosticState = "IDLE" | "CHECKING" | "READY" | "BUFFERING" | "PLAYING" | "FAILED" | "CANCELLED" | "FALLBACK" | "COMPLETED";

export interface PlaybackSessionResult {
  sessionId: string;
  status: "READY" | "UNSUPPORTED" | "UNAVAILABLE";
  availability: P2PAvailability;
  mediaUrl?: string;
  subtitleTracks?: Array<{ label: string; language: string; url: string }>;
}

export interface P2PPlaybackAdapter {
  checkAvailability(source: P2PSource): Promise<P2PAvailability>;
  createPlaybackSession(source: P2PSource): Promise<PlaybackSessionResult>;
  stopPlayback(sessionId: string): Promise<void>;
}

export interface P2PPrivacySettings {
  allowP2P: boolean;
  allowPeerUpload: boolean;
  maxPlaybackDurationSeconds: number;
  maxTransferBytes?: number;
}
