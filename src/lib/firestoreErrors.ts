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

export function formatFirestoreError(reason: unknown): string {
  if (reason && typeof reason === "object" && "code" in reason) {
    const { code, message } = reason as FirestoreError;
    switch (code) {
      case "permission-denied":
        return "Firestore blocked this action (permission denied). In Firebase Console → Firestore → Rules, allow reads and writes for development, then reload. See the project README for example rules.";
      case "unavailable":
      case "deadline-exceeded":
        return "Could not reach Firestore. Check your network and that Firestore is enabled for this project.";
      case "failed-precondition":
        return "Firestore may not be enabled. In Firebase Console, create a Cloud Firestore database (Native mode) for this project.";
      default:
        return message || "Firestore error.";
    }
  }
  if (reason instanceof Error) return reason.message;
  return "Something went wrong.";
}
