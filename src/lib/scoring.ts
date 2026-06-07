export type ScoreInput = {
  predictedA: number | null;
  predictedB: number | null;
  actualA: number | null;
  actualB: number | null;
};

function outcome(a: number, b: number) {
  if (a > b) return "A";
  if (a < b) return "B";
  return "D";
}

export function scorePrediction({ predictedA, predictedB, actualA, actualB }: ScoreInput) {
  if ([predictedA, predictedB, actualA, actualB].some((value) => value === null || value === undefined)) {
    return { points: 0, exact: false, winner: false, hit: false };
  }
  if (predictedA === actualA && predictedB === actualB) {
    return { points: 3, exact: true, winner: false, hit: true };
  }
  const winner = outcome(predictedA!, predictedB!) === outcome(actualA!, actualB!);
  return { points: winner ? 1 : 0, exact: false, winner, hit: winner };
}
