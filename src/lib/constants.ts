export const MOST_LIKELY_QUESTIONS = [
  "הכי סביר שישרוד אפוקליפסת זומבים?",
  "הכי סביר שיהיה מפורסם?",
  "הכי סביר שיאחר למסיבה של עצמו?",
  "הכי סביר שיבכה בפרסומת?",
  "הכי סביר שיזכה בריאליטי?",
  "הכי סביר שישכח איפה חנה?",
  "הכי סביר שיאמץ עשר חיות מחמד?",
  "הכי סביר שיצפה בסדרה שלמה ביום אחד?",
];

export const TEN_SECOND_PROMPTS = [
  "דברים שהיית לוקח לאי מדבר — מילה לכל פריט.",
  "מילים שיוצרות חריזה עם ״משחק״ (גם מומצאות מותר).",
  "סוגי פסטה — קדימה!",
  "דברים עגולים.",
  "תירוצים לאיחור.",
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomRoomCode(): string {
  const n = 100000 + Math.floor(Math.random() * 900000);
  return String(n);
}
