import type { Match } from "./types";
import { getMatchSchedule } from "../data/matchSchedule";

export const GROUP_STAGE_LIMIT = 72;

const groupOrder = "ABCDEFGHIJKL".split("").map((letter) => `Grupo ${letter}`);

export function isGroupStageMatch(match: Match) {
  return match.phase === "Fase de grupos" && match.match_number <= GROUP_STAGE_LIMIT;
}

export function sortMatchesByOfficialNumber(a: Match, b: Match) {
  const scheduleA = getMatchSchedule(a);
  const scheduleB = getMatchSchedule(b);
  return (scheduleA?.matchNumber ?? a.match_number) - (scheduleB?.matchNumber ?? b.match_number);
}

export function getGroupStageMatches(matches: Match[]) {
  return matches.filter(isGroupStageMatch).sort(sortMatchesByOfficialNumber);
}

export function getGroups(matches: Match[]) {
  const groups = [...new Set(matches.map((match) => match.group_name ?? "Sin grupo"))];
  return groups.sort((a, b) => {
    const indexA = groupOrder.indexOf(a);
    const indexB = groupOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}
