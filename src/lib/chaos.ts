import { pick } from "./constants";
import type { ChaosRound, Player } from "./types";

export function normalizeChaos(c?: ChaosRound): ChaosRound {
  return c ?? { event: null };
}

const CHAOS_POOL = [
  "double_points",
  "reverse_votes",
  "fast_mode",
  "mute_player",
  "bonus_target",
] as const;

/** ~25% chance of one chaos event per round */
export function rollChaos(players: Player[]): ChaosRound {
  if (players.length < 2 || Math.random() > 0.25) {
    return { event: null };
  }
  const event = pick([...CHAOS_POOL]);
  const ids = players.map((p) => p.id);
  if (event === "mute_player") {
    return { event: "mute_player", mutedPlayerId: pick(ids) };
  }
  if (event === "bonus_target") {
    return { event: "bonus_target", bonusTargetId: pick(ids) };
  }
  return { event };
}

export function chaosTitleHe(c: ChaosRound): string | null {
  if (!c || c.event === null) return null;
  switch (c.event) {
    case "double_points":
      return "כפול נקודות!";
    case "reverse_votes":
      return "הצבעות הפוכות";
    case "fast_mode":
      return "מצב מהיר";
    case "mute_player":
      return "שחקן מושתק";
    case "bonus_target":
      return "מטרת בונוס";
    default:
      return null;
  }
}

export function chaosDetailHe(c: ChaosRound, players: Player[]): string | null {
  if (!c || c.event === null) return null;
  switch (c.event) {
    case "double_points":
      return "כל הנקודות בסיבוב הזה מוכפלות ×2.";
    case "reverse_votes":
      return "הפעם מנצחים מי שקיבלו הכי מעט הצבעות (המיעוט!).";
    case "fast_mode":
      return "הטיימר לסיבוב הזה קוצר בחצי.";
    case "mute_player": {
      const nick = players.find((p) => p.id === c.mutedPlayerId)?.nickname ?? "…";
      return `${nick} לא יכול/ה להצביע או לענות בסיבוב הזה.`;
    }
    case "bonus_target": {
      const nick = players.find((p) => p.id === c.bonusTargetId)?.nickname ?? "…";
      return `מי שבוחר ב־${nick} מקבל +2 נקודות בונוס (בנוסף לכללים הרגילים).`;
    }
    default:
      return null;
  }
}
