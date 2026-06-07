import { useEffect, useMemo, useState } from "react";
import { Download, Lock, Save, Send, Trophy } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { TeamLabel } from "../components/TeamLabel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { initialMatches } from "../data/initialMatches";
import { getMatchSchedule } from "../data/matchSchedule";
import { generatePredictionPdf } from "../lib/pdf";
import { supabase } from "../lib/supabase";
import type { Match, Prediction, PredictionDetail, RankingRow } from "../lib/types";
import { deadlinePassed, formatDateTime, makeValidationHash } from "../lib/utils";
import { getGroupStageMatches, getGroups } from "../lib/matches";

const DEFAULT_DEADLINE = "2026-06-11T13:00:00-04:00";

export function HomePage() {
  const { profile, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [details, setDetails] = useState<Record<number, PredictionDetail>>({});
  const [ranking, setRanking] = useState<RankingRow | null>(null);
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const visibleMatchIds = useMemo(() => new Set(matches.map((match) => match.id)), [matches]);
  const completed = useMemo(
    () => Object.values(details).filter((d) => visibleMatchIds.has(d.match_id) && d.predicted_goals_a !== null && d.predicted_goals_b !== null).length,
    [details, visibleMatchIds],
  );
  const locked = prediction?.status === "CONFIRMADO" || deadlinePassed(deadline);
  const status = prediction?.status === "CONFIRMADO" ? "CONFIRMADO" : deadlinePassed(deadline) ? "BLOQUEADO POR FECHA" : "BORRADOR";

  useEffect(() => {
    async function load() {
      const [{ data: matchRows }, { data: settingRows }] = await Promise.all([
        supabase.from("matches").select("*").lte("match_number", 72).order("sort_order"),
        supabase.from("settings").select("*").in("key", ["deadline_iso"]),
      ]);
      setMatches(getGroupStageMatches((matchRows as Match[] | null) ?? initialMatches));
      const configuredDeadline = settingRows?.find((row) => row.key === "deadline_iso")?.value;
      if (configuredDeadline) setDeadline(configuredDeadline);
      if (!user) return;
      const { data: pred } = await supabase.from("predictions").select("*").eq("user_id", user.id).maybeSingle();
      if (pred) {
        setPrediction(pred as Prediction);
        const { data: rows } = await supabase.from("prediction_details").select("*").eq("prediction_id", pred.id).lte("match_id", 72);
        setDetails(Object.fromEntries(((rows as PredictionDetail[] | null) ?? []).map((row) => [row.match_id, row])));
      }
      const { data: rank } = await supabase.from("rankings").select("*").eq("user_id", user.id).maybeSingle();
      setRanking((rank as RankingRow | null) ?? null);
    }
    load();
  }, [user]);

  const ensurePrediction = async () => {
    if (prediction) return prediction;
    const { data, error } = await supabase.from("predictions").insert({ user_id: user!.id, status: "BORRADOR" }).select("*").single();
    if (error) throw error;
    setPrediction(data as Prediction);
    return data as Prediction;
  };

  const setScore = (matchId: number, field: "predicted_goals_a" | "predicted_goals_b", value: string) => {
    if (locked) return;
    const parsed = value === "" ? null : Math.max(0, Math.min(99, Number.parseInt(value, 10)));
    setDetails((current) => ({
      ...current,
      [matchId]: { match_id: matchId, predicted_goals_a: current[matchId]?.predicted_goals_a ?? null, predicted_goals_b: current[matchId]?.predicted_goals_b ?? null, [field]: Number.isNaN(parsed) ? null : parsed },
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    setMessage("");
    try {
      const pred = await ensurePrediction();
      const payload = matches
        .map((match) => details[match.id])
        .filter(Boolean)
        .map((detail) => ({ ...detail, prediction_id: pred.id }));
      if (payload.length) await supabase.from("prediction_details").upsert(payload, { onConflict: "prediction_id,match_id" });
      setMessage("Borrador guardado.");
      return pred;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const confirm = async () => {
    if (completed !== matches.length) return;
    const accepted = window.confirm("ATENCION\n\nUna vez confirmado su pronostico no podra modificar ningun resultado ingresado.\n\nEsta accion es irreversible.\n\nDesea continuar?");
    if (!accepted) return;
    const pred = await saveDraft();
    if (!pred) return;
    const userAgent = navigator.userAgent;
    const validationHash = makeValidationHash(`${user!.id}-${Date.now()}`);
    const { data, error } = await supabase.rpc("confirm_prediction", {
      p_prediction_id: pred.id,
      p_user_agent: userAgent,
      p_validation_hash: validationHash,
    });
    if (error) setMessage(error.message);
    else {
      const next = { ...pred, status: "CONFIRMADO" as const, confirmed_at: new Date().toISOString(), confirmation_code: data as string, validation_hash: validationHash };
      setPrediction(next);
      setMessage("Pronostico confirmado. Su comprobante PDF esta listo.");
      await generatePredictionPdf({ profile: profile!, prediction: next, matches, details: Object.values(details) });
    }
  };

  if (!profile) return <Card><CardContent className="pt-5">Complete su perfil desde Supabase Auth para continuar.</CardContent></Card>;

  const phases = [...new Set(matches.map((match) => match.phase))];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{profile.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p><b>Correo:</b> {profile.email}</p>
            <p><b>Estado:</b> <Badge>{status}</Badge></p>
            <p><b>Confirmacion:</b> {formatDateTime(prediction?.confirmed_at)}</p>
            <p><b>Codigo:</b> {prediction?.confirmation_code ?? "Pendiente"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Puntaje</CardTitle></CardHeader>
          <CardContent className="text-3xl font-black text-primary">{ranking?.total_points ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Posicion</CardTitle></CardHeader>
          <CardContent className="text-3xl font-black text-secondary">{ranking?.position ? `#${ranking.position}` : "-"}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Pronostico completo</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{completed} de {matches.length} partidos completados. Fecha limite: {formatDateTime(deadline)}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={locked || saving}><Save size={16} /> Guardar</Button>
              <Button onClick={confirm} disabled={locked || completed !== matches.length}><Send size={16} /> Enviar pronostico definitivo</Button>
              {prediction?.status === "CONFIRMADO" && <Button variant="secondary" onClick={() => generatePredictionPdf({ profile, prediction, matches, details: Object.values(details) })}><Download size={16} /> PDF</Button>}
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-secondary transition-all" style={{ width: `${matches.length ? (completed / matches.length) * 100 : 0}%` }} />
          </div>
          {locked && <p className="flex items-center gap-2 text-sm font-bold text-primary"><Lock size={16} /> El pronostico esta bloqueado.</p>}
          {message && <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {phases.map((phase) => (
            <section key={phase}>
              <h3 className="mb-3 text-xl font-black text-primary">{phase}</h3>
              <div className="space-y-5">
                {getGroups(matches.filter((match) => match.phase === phase)).map((groupName) => (
                  <section key={groupName} className="space-y-3">
                    <h4 className="rounded-md bg-muted px-3 py-2 text-sm font-black text-primary">{groupName}</h4>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {matches.filter((match) => match.phase === phase && (match.group_name ?? "Sin grupo") === groupName).map((match) => {
                        const schedule = getMatchSchedule(match);
                        const teamA = schedule?.teamA ?? match.team_a;
                        const teamB = schedule?.teamB ?? match.team_b;
                        return (
                          <div key={match.id} className="rounded-lg border bg-white p-3 text-sm">
                            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
                              <span className="rounded bg-primary px-2 py-1 text-white">#{schedule?.matchNumber ?? match.match_number}</span>
                              <span>{schedule?.date ?? "Fecha por definir"}</span>
                              <span>{schedule?.time ?? "Hora por definir"}</span>
                              <span>{schedule?.venue ?? match.venue ?? "Estadio por definir"}</span>
                            </div>
                            <div className="grid grid-cols-[minmax(0,1fr)_64px_20px_64px_minmax(0,1fr)] items-center gap-2">
                              <TeamLabel team={teamA} />
                              <Input type="number" min={0} max={99} value={details[match.id]?.predicted_goals_a ?? ""} onChange={(e) => setScore(match.id, "predicted_goals_a", e.target.value)} disabled={locked} className="text-center font-bold" />
                              <span className="text-center font-bold">-</span>
                              <Input type="number" min={0} max={99} value={details[match.id]?.predicted_goals_b ?? ""} onChange={(e) => setScore(match.id, "predicted_goals_b", e.target.value)} disabled={locked} className="text-center font-bold" />
                              <TeamLabel team={teamB} align="right" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
