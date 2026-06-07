import type { Match } from "../lib/types";

const groups: Record<string, string[]> = {
  A: ["Mexico", "Sudafrica", "Corea del Sur", "Republica Checa"],
  B: ["Canada", "Suiza", "Qatar", "Bosnia y Herzegovina"],
  C: ["Brasil", "Marruecos", "Haiti", "Escocia"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Turquia"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Paises Bajos", "Japon", "Tunez", "Suecia"],
  G: ["Belgica", "Egipto", "Iran", "Nueva Zelanda"],
  H: ["Espana", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Noruega", "Irak"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Portugal", "Uzbekistan", "Colombia", "RD Congo"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panama"],
};

const pairings = [
  [0, 1],
  [2, 3],
  [0, 2],
  [3, 1],
  [3, 0],
  [1, 2],
];

const groupMatches = Object.entries(groups).flatMap(([group, teams], groupIndex) =>
  pairings.map(([a, b], index) => {
    const number = groupIndex * 6 + index + 1;
    return {
      id: number,
      match_number: number,
      phase: "Fase de grupos",
      group_name: `Grupo ${group}`,
      team_a: teams[a],
      team_b: teams[b],
      match_date: null,
      venue: null,
      status: "scheduled" as const,
      sort_order: number,
    };
  }),
);

export const initialMatches: Match[] = groupMatches;
