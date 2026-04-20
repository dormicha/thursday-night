"use client";

import { useSyncExternalStore } from "react";
import { getOrCreatePlayerId } from "@/lib/player";

export function usePlayerId(): string {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      queueMicrotask(onStoreChange);
      return () => {};
    },
    getOrCreatePlayerId,
    () => ""
  );
}
