const FLAG_CODE_BY_TEAM: Record<string, string> = {
  "Mexico": "mx",
  "Sudafrica": "za",
  "Corea del Sur": "kr",
  "Republica Checa": "cz",
  "Canada": "ca",
  "Suiza": "ch",
  "Qatar": "qa",
  "Bosnia y Herzegovina": "ba",
  "Brasil": "br",
  "Marruecos": "ma",
  "Haiti": "ht",
  "Escocia": "gb-sct",
  "Estados Unidos": "us",
  "Paraguay": "py",
  "Australia": "au",
  "Turquia": "tr",
  "Alemania": "de",
  "Curazao": "cw",
  "Costa de Marfil": "ci",
  "Ecuador": "ec",
  "Paises Bajos": "nl",
  "Japon": "jp",
  "Tunez": "tn",
  "Suecia": "se",
  "Belgica": "be",
  "Egipto": "eg",
  "Iran": "ir",
  "Nueva Zelanda": "nz",
  "Espana": "es",
  "Cabo Verde": "cv",
  "Arabia Saudita": "sa",
  "Uruguay": "uy",
  "Francia": "fr",
  "Senegal": "sn",
  "Noruega": "no",
  "Irak": "iq",
  "Argentina": "ar",
  "Argelia": "dz",
  "Austria": "at",
  "Jordania": "jo",
  "Portugal": "pt",
  "Uzbekistan": "uz",
  "Colombia": "co",
  "RD Congo": "cd",
  "Inglaterra": "gb-eng",
  "Croacia": "hr",
  "Ghana": "gh",
  "Panama": "pa",
};

export function getTeamFlagCode(team: string) {
  return FLAG_CODE_BY_TEAM[team] ?? null;
}

export function getTeamFlagUrl(team: string) {
  const code = getTeamFlagCode(team);
  return code ? `https://flagcdn.com/${code}.svg` : null;
}
