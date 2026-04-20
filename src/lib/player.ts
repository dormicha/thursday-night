const PID = "thursday-night-player-id";

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  let id = window.localStorage.getItem(PID);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    window.localStorage.setItem(PID, id);
  }
  return id;
}
