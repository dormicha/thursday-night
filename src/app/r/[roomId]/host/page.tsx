"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { HostScreen } from "@/components/HostScreen";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { useRoom } from "@/hooks/useRoom";
import { isFirebaseConfigured } from "@/lib/firebase";
import { usePlayerId } from "@/hooks/usePlayerId";

export default function HostPage() {
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
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  if (room === undefined) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">טוען…</p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-white">
        <p className="text-lg">החדר לא נמצא.</p>
        <Link className="text-fuchsia-400 underline" href="/">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">טוען…</p>
      </div>
    );
  }

  const isHost = playerId === room.hostId;

  return <HostScreen roomId={roomId} room={room} isHost={isHost} />;
}
