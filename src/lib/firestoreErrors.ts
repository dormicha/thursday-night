import type { FirestoreError } from "firebase/firestore";

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${label} The request took too long — check your network, Firestore rules, and that Firestore is enabled in the Firebase Console.`
        )
      );
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  }) as Promise<T>;
}

const messagesEn = {
  permission:
    "Firestore blocked this action (permission denied). In Firebase Console → Firestore → Rules, allow reads and writes for development, then reload. See the project README for example rules.",
  unavailable: "Could not reach Firestore. Check your network and that Firestore is enabled for this project.",
  failedPrecondition:
    "Firestore may not be enabled. In Firebase Console, create a Cloud Firestore database (Native mode) for this project.",
  generic: "Firestore error.",
  unknown: "Something went wrong.",
} as const;

const messagesHe = {
  permission:
    "Firestore חסם את הפעולה (אין הרשאה). ב-Firebase Console → Firestore → Rules, אפשר קריאה וכתיבה לפחות לפיתוח, ואז רענן. ראה README לדוגמת כללים.",
  unavailable: "לא ניתן להגיע ל-Firestore. בדוק רשת וש-Firestore מופעל בפרויקט.",
  failedPrecondition: "ייתכן ש-Firestore לא הופעל. ב-Firebase Console צור מסד Cloud Firestore (מצב Native) לפרויקט.",
  generic: "שגיאת Firestore.",
  unknown: "משהו השתבש.",
} as const;

export function formatFirestoreError(reason: unknown, lang: "en" | "he" = "he"): string {
  const m = lang === "he" ? messagesHe : messagesEn;
  if (reason && typeof reason === "object" && "code" in reason) {
    const { code, message } = reason as FirestoreError;
    switch (code) {
      case "permission-denied":
        return m.permission;
      case "unavailable":
      case "deadline-exceeded":
        return m.unavailable;
      case "failed-precondition":
        return m.failedPrecondition;
      default:
        return message || m.generic;
    }
  }
  if (reason instanceof Error) return reason.message;
  return m.unknown;
}
