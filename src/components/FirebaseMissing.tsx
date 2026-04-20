export function FirebaseMissing() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/40 bg-amber-950/40 p-6 text-amber-100">
      <h2 className="text-xl font-bold">Firebase not configured</h2>
      <p className="mt-2 text-sm leading-relaxed opacity-90">
        Create a Firebase project, enable Firestore, add a web app, then copy the config into{" "}
        <code className="rounded bg-black/40 px-1.5 py-0.5">.env.local</code> using{" "}
        <code className="rounded bg-black/40 px-1.5 py-0.5">.env.example</code> as a template.
      </p>
      <p className="mt-3 text-sm opacity-80">
        For local play, set Firestore rules to allow read/write for development (see README).
      </p>
    </div>
  );
}
