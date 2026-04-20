"use client";

import { useEffect, useState } from "react";
import type { FirestoreError } from "firebase/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";
import { formatFirestoreError } from "@/lib/firestoreErrors";
import { subscribeRoom } from "@/lib/room";
import type { RoomDoc } from "@/lib/types";

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<RoomDoc | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => {
        setError("not_configured");
        setRoom(null);
      });
      return;
    }
    queueMicrotask(() => {
      setRoom(undefined);
      setError(null);
    });
    const unsub = subscribeRoom(
      roomId,
      (data) => {
        setError(null);
        setRoom(data);
      },
      (err: FirestoreError) => {
        setError(formatFirestoreError(err));
        setRoom(null);
      }
    );
    return () => unsub();
  }, [roomId]);

  return { room, error };
}
