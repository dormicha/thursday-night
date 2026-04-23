"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { formatFirestoreError, withTimeout } from "@/lib/firestoreErrors";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getOrCreatePlayerId } from "@/lib/player";
import { createRoom, fetchRoom, joinRoom } from "@/lib/room";
import { resumeAudio } from "@/lib/sounds";

export default function Home() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [code, setCode] = useState("");
  const [joinNick, setJoinNick] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "create" | "join">(null);

  const configured = isFirebaseConfigured();

  async function onCreate() {
    setErr(null);
    if (!nick.trim()) {
      setErr("Enter a nickname.");
      return;
    }
    setBusy("create");
    try {
      resumeAudio();
      const pid = getOrCreatePlayerId();
      const room = await withTimeout(
        createRoom(pid, nick.trim()),
        25000,
        "Could not create the room."
      );
      router.push(`/r/${room}/host`);
    } catch (e) {
      setErr(formatFirestoreError(e, "en"));
    } finally {
      setBusy(null);
    }
  }

  async function onJoin() {
    setErr(null);
    const c = code.replace(/\D/g, "").slice(0, 6);
    if (c.length < 4) {
      setErr("Enter a room code (4–6 digits).");
      return;
    }
    if (!joinNick.trim()) {
      setErr("Enter a nickname.");
      return;
    }
    setBusy("join");
    try {
      resumeAudio();
      const pid = getOrCreatePlayerId();
      const exists = await withTimeout(fetchRoom(c), 25000, "Could not look up the room.");
      if (!exists) {
        setErr("Room not found. Check the code.");
        setBusy(null);
        return;
      }
      await withTimeout(joinRoom(c, pid, joinNick.trim()), 25000, "Could not join the room.");
      router.push(`/r/${c}`);
    } catch (e) {
      setErr(formatFirestoreError(e, "en"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 px-4 py-16 text-white">
      <div className="w-full max-w-lg space-y-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-300/90">Party game</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">Thursday Night</h1>
          <p className="mt-4 text-lg text-violet-100/85">
            One TV, phones for everyone. Four quick rounds. No accounts — just nicknames.
          </p>
        </div>

        {/* Join first (phones), then Host (TV) — order fixed in DOM + flex (see #join-room / #host-tv) */}
        <div className="flex w-full flex-col gap-10">
          <section
            id="join-room"
            className="order-1 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <h2 className="text-xl font-bold text-emerald-200">Join (phone)</h2>
            <p className="mt-1 text-sm text-violet-200/80">Enter the code from the TV.</p>
            <input
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Room code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={!configured || busy !== null}
            />
            <input
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Your nickname"
              value={joinNick}
              onChange={(e) => setJoinNick(e.target.value)}
              disabled={!configured || busy !== null}
            />
            <button
              type="button"
              className="mt-3 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-emerald-950 disabled:opacity-40"
              onClick={() => void onJoin()}
              disabled={!configured || busy !== null}
            >
              {busy === "join" ? "Joining…" : "Join room"}
            </button>
          </section>

          <section
            id="host-tv"
            className="order-2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <h2 className="text-xl font-bold text-fuchsia-200">Host (TV)</h2>
            <p className="mt-1 text-sm text-violet-200/80">Create a room, then open this page on the big screen.</p>
            <input
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-fuchsia-400"
              placeholder="Your nickname"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              disabled={!configured || busy !== null}
            />
            <button
              type="button"
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-lg font-bold shadow-lg shadow-fuchsia-500/25 disabled:opacity-40"
              onClick={() => void onCreate()}
              disabled={!configured || busy !== null}
            >
              {busy === "create" ? "Creating room…" : "Create room"}
            </button>
          </section>
        </div>

        {!configured ? (
          <>
            <FirebaseMissing locale="en" />
            <p className="text-center text-sm text-amber-200/90">
              Until Firebase is configured, the buttons above stay disabled.
            </p>
          </>
        ) : null}

        {err ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {err}
          </p>
        ) : null}

        <p className="text-center text-sm text-violet-300/70">
          Need Firebase config? See{" "}
          <Link className="underline hover:text-white" href="https://firebase.google.com/docs/firestore">
            Firestore setup
          </Link>{" "}
          and the project README.
        </p>
      </div>
    </div>
  );
}
