type Props = {
  locale?: "en" | "he";
};

export function FirebaseMissing({ locale = "he" }: Props) {
  if (locale === "en") {
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

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/40 bg-amber-950/40 p-6 text-amber-100">
      <h2 className="text-xl font-bold">Firebase לא מוגדר</h2>
      <p className="mt-2 text-sm leading-relaxed opacity-90">
        צור פרויקט ב-Firebase, הפעל Firestore, הוסף אפליקציית web, והעתק את ההגדרות לקובץ{" "}
        <code className="rounded bg-black/40 px-1.5 py-0.5">.env.local</code> לפי התבנית ב־
        <code className="rounded bg-black/40 px-1.5 py-0.5">.env.example</code>.
      </p>
      <p className="mt-3 text-sm opacity-80">למשחק מקומי, הגדר כללי Firestore שמאפשרים קריאה/כתיבה לפיתוח (ראה README).</p>
    </div>
  );
}
