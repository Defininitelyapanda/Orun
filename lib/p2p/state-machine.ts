import type { P2PDiagnosticState, P2PFailureCategory } from "./types";

export type P2PPlayerState = { state: P2PDiagnosticState; failure?: P2PFailureCategory; message?: string; fallbackOffered: boolean };
export type P2PPlayerEvent =
  | { type: "CHECK" }
  | { type: "READY" }
  | { type: "BUFFER" }
  | { type: "PLAY" }
  | { type: "COMPLETE" }
  | { type: "FAIL"; failure: P2PFailureCategory; message: string }
  | { type: "CANCEL" }
  | { type: "FALLBACK" };

const transitions: Record<P2PDiagnosticState, P2PPlayerEvent["type"][]> = {
  IDLE: ["CHECK", "CANCEL"], CHECKING: ["READY", "FAIL", "CANCEL"], READY: ["BUFFER", "PLAY", "FAIL", "CANCEL"],
  BUFFERING: ["PLAY", "FAIL", "CANCEL"], PLAYING: ["BUFFER", "COMPLETE", "FAIL", "CANCEL"], FAILED: ["CHECK", "FALLBACK"],
  CANCELLED: ["CHECK", "FALLBACK"], FALLBACK: [], COMPLETED: [],
};

export function transitionP2PState(current: P2PPlayerState, event: P2PPlayerEvent): P2PPlayerState {
  if (!transitions[current.state].includes(event.type)) return current;
  if (event.type === "FAIL") return { state: "FAILED", failure: event.failure, message: event.message, fallbackOffered: true };
  if (event.type === "CANCEL") return { state: "CANCELLED", failure: "USER_CANCELLED", message: "The experimental session was cancelled.", fallbackOffered: true };
  const state = ({ CHECK: "CHECKING", READY: "READY", BUFFER: "BUFFERING", PLAY: "PLAYING", COMPLETE: "COMPLETED", FALLBACK: "FALLBACK" } as const)[event.type];
  return { state, fallbackOffered: state === "FALLBACK" };
}

export const initialP2PPlayerState: P2PPlayerState = { state: "IDLE", fallbackOffered: false };
