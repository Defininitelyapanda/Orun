import { describe, expect, it } from "vitest";
import { BrowserP2PAdapter } from "@/lib/p2p/browser-adapter";
import { initialP2PPlayerState, transitionP2PState } from "@/lib/p2p/state-machine";

describe("P2P browser adapter and failure states", () => {
  it("reports unsupported browsers honestly", async () => expect((await new BrowserP2PAdapter(undefined, false).checkAvailability({ contentId: "f1", sourceType: "TORRENT_METADATA", infoHash: "a".repeat(40) })).status).toBe("UNSUPPORTED"));
  it("does not claim native torrent playback without an approved engine", async () => expect((await new BrowserP2PAdapter(undefined, true).checkAvailability({ contentId: "f1", sourceType: "WEBTORRENT", manifestUrl: "https://media.example/test.torrent" })).reason).toContain("not natively playable"));
  it("represents startup timeout as a genuine failure", () => { const checking = transitionP2PState(initialP2PPlayerState, { type: "CHECK" }); expect(transitionP2PState(checking, { type: "FAIL", failure: "STARTUP_TIMEOUT", message: "Timed out" })).toMatchObject({ state: "FAILED", failure: "STARTUP_TIMEOUT", fallbackOffered: true }); });
  it("supports immediate cancellation and explicit fallback", () => { const cancelled = transitionP2PState(transitionP2PState(initialP2PPlayerState, { type: "CHECK" }), { type: "CANCEL" }); expect(cancelled.state).toBe("CANCELLED"); expect(transitionP2PState(cancelled, { type: "FALLBACK" }).state).toBe("FALLBACK"); });
});
