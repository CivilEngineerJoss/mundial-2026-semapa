import type { Match } from "../lib/types";

export type MatchSchedule = {
  matchNumber: number;
  date: string;
  time: string;
  venue: string;
  teamA: string;
  teamB: string;
};

export const matchSchedule: MatchSchedule[] = [
  { matchNumber: 1, date: "11-jun", time: "15:00", venue: "Ciudad de Mexico", teamA: "Mexico", teamB: "Sudafrica" },
  { matchNumber: 2, date: "11-jun", time: "22:00", venue: "Guadalajara", teamA: "Corea del Sur", teamB: "Republica Checa" },
  { matchNumber: 3, date: "12-jun", time: "15:00", venue: "Toronto", teamA: "Canada", teamB: "Bosnia y Herzegovina" },
  { matchNumber: 4, date: "12-jun", time: "21:00", venue: "Los Angeles", teamA: "Estados Unidos", teamB: "Paraguay" },
  { matchNumber: 5, date: "13-jun", time: "21:00", venue: "Boston", teamA: "Haiti", teamB: "Escocia" },
  { matchNumber: 6, date: "14-jun", time: "00:00", venue: "Vancouver", teamA: "Australia", teamB: "Turquia" },
  { matchNumber: 7, date: "13-jun", time: "18:00", venue: "Jersey", teamA: "Brasil", teamB: "Marruecos" },
  { matchNumber: 8, date: "13-jun", time: "15:00", venue: "San Francisco", teamA: "Qatar", teamB: "Suiza" },
  { matchNumber: 9, date: "14-jun", time: "19:00", venue: "Filadelfia", teamA: "Costa de Marfil", teamB: "Ecuador" },
  { matchNumber: 10, date: "14-jun", time: "13:00", venue: "Houston", teamA: "Alemania", teamB: "Curazao" },
  { matchNumber: 11, date: "14-jun", time: "16:00", venue: "Dallas", teamA: "Paises Bajos", teamB: "Japon" },
  { matchNumber: 12, date: "14-jun", time: "22:00", venue: "Monterrey", teamA: "Suecia", teamB: "Tunez" },
  { matchNumber: 13, date: "15-jun", time: "18:00", venue: "Miami", teamA: "Arabia Saudita", teamB: "Uruguay" },
  { matchNumber: 14, date: "15-jun", time: "12:00", venue: "Atlanta", teamA: "Espana", teamB: "Cabo Verde" },
  { matchNumber: 15, date: "15-jun", time: "21:00", venue: "Los Angeles", teamA: "Iran", teamB: "Nueva Zelanda" },
  { matchNumber: 16, date: "15-jun", time: "15:00", venue: "Seattle", teamA: "Belgica", teamB: "Egipto" },
  { matchNumber: 17, date: "16-jun", time: "15:00", venue: "N. York/N. Jersey", teamA: "Francia", teamB: "Senegal" },
  { matchNumber: 18, date: "16-jun", time: "18:00", venue: "Boston", teamA: "Irak", teamB: "Noruega" },
  { matchNumber: 19, date: "16-jun", time: "21:00", venue: "Kansas City", teamA: "Argentina", teamB: "Argelia" },
  { matchNumber: 20, date: "17-jun", time: "00:00", venue: "San Francisco", teamA: "Austria", teamB: "Jordania" },
  { matchNumber: 21, date: "17-jun", time: "19:00", venue: "Toronto", teamA: "Ghana", teamB: "Panama" },
  { matchNumber: 22, date: "17-jun", time: "16:00", venue: "Dallas", teamA: "Inglaterra", teamB: "Croacia" },
  { matchNumber: 23, date: "17-jun", time: "13:00", venue: "Houston", teamA: "Portugal", teamB: "RD Congo" },
  { matchNumber: 24, date: "17-jun", time: "22:00", venue: "Mexico", teamA: "Uzbekistan", teamB: "Colombia" },
  { matchNumber: 25, date: "18-jun", time: "12:00", venue: "Atlanta", teamA: "Republica Checa", teamB: "Sudafrica" },
  { matchNumber: 26, date: "18-jun", time: "15:00", venue: "Los Angeles", teamA: "Suiza", teamB: "Bosnia y Herzegovina" },
  { matchNumber: 27, date: "18-jun", time: "18:00", venue: "Vancouver", teamA: "Canada", teamB: "Qatar" },
  { matchNumber: 28, date: "18-jun", time: "21:00", venue: "Guadalajara", teamA: "Mexico", teamB: "Corea del Sur" },
  { matchNumber: 29, date: "19-jun", time: "20:30", venue: "Filadelfia", teamA: "Brasil", teamB: "Haiti" },
  { matchNumber: 30, date: "19-jun", time: "18:00", venue: "Boston", teamA: "Escocia", teamB: "Marruecos" },
  { matchNumber: 31, date: "19-jun", time: "23:00", venue: "San Francisco", teamA: "Turquia", teamB: "Paraguay" },
  { matchNumber: 32, date: "19-jun", time: "15:00", venue: "Seattle", teamA: "Estados Unidos", teamB: "Australia" },
  { matchNumber: 33, date: "20-jun", time: "16:00", venue: "Toronto", teamA: "Alemania", teamB: "Costa de Marfil" },
  { matchNumber: 34, date: "20-jun", time: "20:00", venue: "Kansas City", teamA: "Ecuador", teamB: "Curazao" },
  { matchNumber: 35, date: "20-jun", time: "13:00", venue: "Houston", teamA: "Paises Bajos", teamB: "Suecia" },
  { matchNumber: 36, date: "21-jun", time: "00:00", venue: "Monterrey", teamA: "Tunez", teamB: "Japon" },
  { matchNumber: 37, date: "21-jun", time: "18:00", venue: "Miami", teamA: "Uruguay", teamB: "Cabo Verde" },
  { matchNumber: 38, date: "21-jun", time: "12:00", venue: "Atlanta", teamA: "Espana", teamB: "Arabia Saudita" },
  { matchNumber: 39, date: "21-jun", time: "15:00", venue: "Los Angeles", teamA: "Belgica", teamB: "Iran" },
  { matchNumber: 40, date: "21-jun", time: "21:00", venue: "Vancouver", teamA: "Nueva Zelanda", teamB: "Egipto" },
  { matchNumber: 41, date: "22-jun", time: "20:00", venue: "N. York/N. Jersey", teamA: "Noruega", teamB: "Senegal" },
  { matchNumber: 42, date: "22-jun", time: "17:00", venue: "Filadelfia", teamA: "Francia", teamB: "Irak" },
  { matchNumber: 43, date: "22-jun", time: "13:00", venue: "Dallas", teamA: "Argentina", teamB: "Austria" },
  { matchNumber: 44, date: "22-jun", time: "23:00", venue: "San Francisco", teamA: "Jordania", teamB: "Argelia" },
  { matchNumber: 45, date: "23-jun", time: "16:00", venue: "Boston", teamA: "Inglaterra", teamB: "Ghana" },
  { matchNumber: 46, date: "23-jun", time: "19:00", venue: "Toronto", teamA: "Panama", teamB: "Croacia" },
  { matchNumber: 47, date: "23-jun", time: "13:00", venue: "Houston", teamA: "Portugal", teamB: "Uzbekistan" },
  { matchNumber: 48, date: "23-jun", time: "22:00", venue: "Guadalajara", teamA: "Colombia", teamB: "RD Congo" },
  { matchNumber: 49, date: "24-jun", time: "18:00", venue: "Miami", teamA: "Escocia", teamB: "Brasil" },
  { matchNumber: 50, date: "24-jun", time: "18:00", venue: "Atlanta", teamA: "Marruecos", teamB: "Haiti" },
  { matchNumber: 51, date: "24-jun", time: "15:00", venue: "Vancouver", teamA: "Suiza", teamB: "Canada" },
  { matchNumber: 52, date: "24-jun", time: "15:00", venue: "Seattle", teamA: "Bosnia y Herzegovina", teamB: "Qatar" },
  { matchNumber: 53, date: "24-jun", time: "21:00", venue: "Ciudad de Mexico", teamA: "Republica Checa", teamB: "Mexico" },
  { matchNumber: 54, date: "24-jun", time: "21:00", venue: "Monterrey", teamA: "Sudafrica", teamB: "Corea del Sur" },
  { matchNumber: 55, date: "25-jun", time: "16:00", venue: "Filadelfia", teamA: "Curazao", teamB: "Costa de Marfil" },
  { matchNumber: 56, date: "25-jun", time: "16:00", venue: "Jersey", teamA: "Ecuador", teamB: "Alemania" },
  { matchNumber: 57, date: "25-jun", time: "19:00", venue: "Dallas", teamA: "Japon", teamB: "Suecia" },
  { matchNumber: 58, date: "25-jun", time: "19:00", venue: "Kansas City", teamA: "Tunez", teamB: "Paises Bajos" },
  { matchNumber: 59, date: "25-jun", time: "22:00", venue: "Los Angeles", teamA: "Turquia", teamB: "Estados Unidos" },
  { matchNumber: 60, date: "25-jun", time: "22:00", venue: "San Francisco", teamA: "Paraguay", teamB: "Australia" },
  { matchNumber: 61, date: "26-jun", time: "15:00", venue: "Boston", teamA: "Noruega", teamB: "Francia" },
  { matchNumber: 62, date: "26-jun", time: "15:00", venue: "Toronto", teamA: "Senegal", teamB: "Irak" },
  { matchNumber: 63, date: "26-jun", time: "23:00", venue: "Seattle", teamA: "Egipto", teamB: "Iran" },
  { matchNumber: 64, date: "26-jun", time: "23:00", venue: "Vancouver", teamA: "Nueva Zelanda", teamB: "Belgica" },
  { matchNumber: 65, date: "26-jun", time: "20:00", venue: "Houston", teamA: "Cabo Verde", teamB: "Arabia Saudita" },
  { matchNumber: 66, date: "26-jun", time: "20:00", venue: "Guadalajara", teamA: "Uruguay", teamB: "Espana" },
  { matchNumber: 67, date: "27-jun", time: "17:00", venue: "N. York/N. Jersey", teamA: "Panama", teamB: "Inglaterra" },
  { matchNumber: 68, date: "27-jun", time: "17:00", venue: "Filadelfia", teamA: "Croacia", teamB: "Ghana" },
  { matchNumber: 69, date: "27-jun", time: "22:00", venue: "Kansas City", teamA: "Argelia", teamB: "Austria" },
  { matchNumber: 70, date: "27-jun", time: "22:00", venue: "Dallas", teamA: "Jordania", teamB: "Argentina" },
  { matchNumber: 71, date: "27-jun", time: "19:30", venue: "Miami", teamA: "Colombia", teamB: "Portugal" },
  { matchNumber: 72, date: "27-jun", time: "19:30", venue: "Atlanta", teamA: "RD Congo", teamB: "Uzbekistan" },
];

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const scheduleByNumber = new Map(matchSchedule.map((match) => [match.matchNumber, match]));
const scheduleByPair = new Map<string, MatchSchedule>();
matchSchedule.forEach((match) => {
  scheduleByPair.set(`${normalize(match.teamA)}|${normalize(match.teamB)}`, match);
  scheduleByPair.set(`${normalize(match.teamB)}|${normalize(match.teamA)}`, match);
});

export function getMatchSchedule(match: Match) {
  return scheduleByPair.get(`${normalize(match.team_a)}|${normalize(match.team_b)}`) ?? scheduleByNumber.get(match.match_number);
}
