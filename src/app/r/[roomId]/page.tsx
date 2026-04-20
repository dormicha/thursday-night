"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PlayerScreen } from "@/components/PlayerScreen";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { useRoom } from "@/hooks/useRoom";
import { isFirebaseConfigured } from "@/lib/firebase";
import { usePlayerId } from "@/hooks/usePlayerId";

export default function PlayerPage() {
  const params = useParams();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";
  const { room, error } = useRoom(roomId);
  const playerId = usePlayerId();

  if (error === "not_configured" || !isFirebaseConfigured()) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 p-6">
        <FirebaseMissing />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-white">
        <p className="max-w-lg text-lg leading-relaxed text-red-200">{error}</p>
        <Link className="text-fuchsia-400 underline" href="/">
          Back home
        </Link>
      </div>
    );
  }

  if (room === undefined) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Loading…</p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-white">
        <p className="text-lg">Room not found.</p>
        <Link className="text-fuchsia-400 underline" href="/">
          Back home
        </Link>
      </div>
    );
  }

  return <PlayerScreen roomId={roomId} room={room} playerId={playerId} />;
}
