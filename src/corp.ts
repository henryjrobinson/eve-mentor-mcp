/**
 * evaluate_corp — newbie-friendliness signals for a corporation. The API can't
 * see recruitment status or culture, so this reports the facts it CAN verify
 * (size, age, war exposure, recent activity) as signals, and hands the player
 * the questions to ask that no API can answer.
 */

import { esiFetch, namesForIds, resolveNames } from "./esi.js";
import { getCorpActivity } from "./zkill.js";

interface CorpInfo {
  name: string;
  ticker: string;
  member_count: number;
  date_founded?: string;
  ceo_id: number;
  war_eligible?: boolean;
  description?: string;
}

interface Signal {
  level: "good" | "caution" | "info";
  signal: string;
}

export interface CorpEvaluation {
  corp: {
    name: string;
    ticker: string;
    memberCount: number;
    foundedDate: string | null;
    ageYears: number | null;
    ceo: string;
    warEligible: boolean;
  };
  activity: { recentKillmailsSampled: number; mostRecentActivity: string | null };
  signals: Signal[];
  questionsToAsk: string[];
  note: string;
}

function sizeSignal(memberCount: number): Signal {
  if (memberCount < 10) {
    return { level: "caution", signal: `Tiny (${memberCount} members) — could be a close-knit start or nearly dead; easy to find yourself alone or to be a one-person scam.` };
  }
  if (memberCount > 5000) {
    return { level: "info", signal: `Huge bloc-scale corp (${memberCount} members) — lots of content and free ships, but you're a small fish and onboarding can be impersonal.` };
  }
  if (memberCount >= 50) {
    return { level: "good", signal: `Healthy size (${memberCount} members) — big enough to have people online and structure, small enough to be known.` };
  }
  return { level: "info", signal: `Small corp (${memberCount} members) — can be friendly and personal; confirm there's activity in your timezone.` };
}

export async function evaluateCorp(corpName: string): Promise<CorpEvaluation> {
  const ids = await resolveNames([corpName]);
  const corp = ids.corporations?.[0];
  if (!corp) {
    throw new Error(`No corporation named "${corpName}" found. Names must be exact (the full corp name, not the ticker).`);
  }

  const { data } = await esiFetch<CorpInfo>(`/corporations/${corp.id}/`);
  const [ceoNames, activity] = await Promise.all([
    namesForIds([data.ceo_id]),
    getCorpActivity(corp.id),
  ]);

  const ageYears = data.date_founded
    ? Number(((Date.now() - Date.parse(data.date_founded)) / (365 * 86_400_000)).toFixed(1))
    : null;

  const signals: Signal[] = [sizeSignal(data.member_count)];
  if (ageYears !== null) {
    signals.push(
      ageYears >= 1
        ? { level: "good", signal: `Established (${ageYears} years old) — it has survived past the churn most new corps die in.` }
        : { level: "caution", signal: `Young corp (${ageYears} years old) — newer corps fold often; not disqualifying, but ask about their plans.` },
    );
  }
  signals.push(
    data.war_eligible
      ? { level: "caution", signal: "War-eligible: this corp can be declared war on, so joining exposes you to PvP anywhere, even in high-sec. Normal for active corps; know it going in." }
      : { level: "good", signal: "Not currently war-eligible — lower surprise-PvP risk for a brand-new player." },
  );
  signals.push(
    activity.mostRecentActivity
      ? { level: "info", signal: `Shows recent PvP on zKillboard (most recent ${activity.mostRecentActivity}) — the corp is active, though it also means they undock into danger.` }
      : { level: "info", signal: "No recent killmails on zKillboard — could be a quiet industrial/PvE corp, or simply inactive. Check in-game." },
  );

  return {
    corp: {
      name: data.name,
      ticker: data.ticker,
      memberCount: data.member_count,
      foundedDate: data.date_founded ?? null,
      ageYears,
      ceo: ceoNames.get(data.ceo_id) ?? `character-${data.ceo_id}`,
      warEligible: Boolean(data.war_eligible),
    },
    activity,
    signals,
    questionsToAsk: [
      "Are you recruiting, and do you take brand-new players?",
      "What timezone is most active, and does it match mine?",
      "What do you actually do most nights — PvP, mining, missions, industry?",
      "Do you provide ships or doctrine fits for newbies?",
      "Is there a tax on my income, and how much?",
    ],
    note:
      "These are the only signals the API exposes — they cannot tell you whether the people are kind, whether " +
      "it's a scam, or whether it's recruiting. Treat this as a sanity check, then judge the corp on how they " +
      "answer the questionsToAsk in their recruitment channel. A good newbie corp answers patiently.",
  };
}
