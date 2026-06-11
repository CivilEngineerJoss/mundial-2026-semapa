import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Lock, Plus, Save, Send, Trophy } from "lucide-react";
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

const DEFAULT_DEADLINE = "2026-06-11T15:00:00-04:00";
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/HMAQHMa0TMs8VVDCBBiNU3";
const PAYMENT_QR_URL = `${import.meta.env.BASE_URL}payment-qr.jpeg`;

export function HomePage() {
  const { profile, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [details, setDetails] = useState<Record<number, PredictionDetail>>({});
  const [ranking, setRanking] = useState<RankingRow | null>(null);
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);
  const [prizes, setPrizes] = useState("Primer lugar\nSegundo lugar\nTercer lugar");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentQrMissing, setPaymentQrMissing] = useState(false);

  const visibleMatchIds = useMemo(() => new Set(matches.map((match) => match.id)), [matches]);
  const completed = useMemo(
    () => Object.values(details).filter((d) => visibleMatchIds.has(d.match_id) && d.predicted_goals_a !== null && d.predicted_goals_b !== null).length,
    [details, visibleMatchIds],
  );
  const locked = prediction?.status === "CONFIRMADO" || deadlinePassed(deadline);
  const status = prediction?.status === "CONFIRMADO" ? "CONFIRMADO" : deadlinePassed(deadline) ? "BLOQUEADO POR FECHA" : "BORRADOR";
  const paymentApproved = prediction?.payment_status === "APROBADO";
  const paymentPending = prediction?.status === "CONFIRMADO" && !paymentApproved;
  const maxPredictions = Math.max(1, profile?.max_predictions ?? 1);
  const hasDraftPrediction = predictions.some((row) => row.status === "BORRADOR");
  const canCreatePrediction = Boolean(user && predictions.length < maxPredictions && !hasDraftPrediction && !deadlinePassed(deadline));

  const loadPredictionDetails = async (pred: Prediction | null) => {
    if (!pred) {
      setDetails({});
      return;
    }
    const { data: rows } = await supabase.from("prediction_details").select("*").eq("prediction_id", pred.id);
    setDetails(Object.fromEntries(((rows as PredictionDetail[] | null) ?? []).map((row) => [row.match_id, row])));
  };

  const loadRankingFor = async (pred: Prediction | null) => {
    if (!pred) {
      setRanking(null);
      return;
    }
    const { data: rank } = await supabase.from("rankings").select("*").eq("prediction_id", pred.id).maybeSingle();
    setRanking((rank as RankingRow | null) ?? null);
  };

  useEffect(() => {
    async function load() {
      const [{ data: matchRows }, { data: settingRows }] = await Promise.all([
        supabase.from("matches").select("*").lte("match_number", 72).order("sort_order"),
        supabase.from("settings").select("*").in("key", ["deadline_iso", "prizes_text"]),
      ]);
      setMatches(getGroupStageMatches((matchRows as Match[] | null) ?? initialMatches));
      const configuredDeadline = settingRows?.find((row) => row.key === "deadline_iso")?.value;
      const configuredPrizes = settingRows?.find((row) => row.key === "prizes_text")?.value;
      if (configuredDeadline) setDeadline(configuredDeadline);
      if (configuredPrizes) setPrizes(configuredPrizes);
      if (!user) return;
      const { data: predRows } = await supabase.from("predictions").select("*").eq("user_id", user.id).order("prediction_slot").order("created_at");
      const list = (predRows as Prediction[] | null) ?? [];
      const active = list.find((row) => row.status === "BORRADOR") ?? list[0] ?? null;
      setPredictions(list);
      setPrediction(active);
      await loadPredictionDetails(active);
      await loadRankingFor(active);
    }
    load();
  }, [user]);

  const ensurePrediction = async () => {
    if (prediction?.status === "BORRADOR") return prediction;
    const nextSlot = Math.max(0, ...predictions.map((row) => row.prediction_slot ?? 1)) + 1;
    const { data, error } = await supabase.from("predictions").insert({ user_id: user!.id, status: "BORRADOR", prediction_slot: nextSlot }).select("*").single();
    if (error) throw error;
    const next = data as Prediction;
    setPredictions((current) => [...current, next]);
    setPrediction(next);
    setDetails({});
    setRanking(null);
    return next;
  };

  const switchPrediction = async (predictionId: string) => {
    const next = predictions.find((row) => row.id === predictionId) ?? null;
    setPrediction(next);
    setMessage("");
    await loadPredictionDetails(next);
    await loadRankingFor(next);
  };

  const createAdditionalPrediction = async () => {
    if (!canCreatePrediction) return;
    setMessage("");
    try {
      const next = await ensurePrediction();
      setMessage(`Pronostico #${next.prediction_slot ?? predictions.length + 1} creado. Complete los partidos y confirme cuando este listo.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear otro pronostico.");
    }
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
        .filter((detail): detail is PredictionDetail => Boolean(detail) && detail.predicted_goals_a !== null && detail.predicted_goals_b !== null)
        .map((detail) => ({
          prediction_id: pred.id,
          match_id: detail.match_id,
          predicted_goals_a: detail.predicted_goals_a,
          predicted_goals_b: detail.predicted_goals_b,
        }));
      if (payload.length) {
        const { error } = await supabase.from("prediction_details").upsert(payload, { onConflict: "prediction_id,match_id" });
        if (error) throw error;
        await loadPredictionDetails(pred);
      }
      setMessage(`Borrador guardado: ${payload.length} partido(s) con marcador completo.`);
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
      const next = { ...pred, status: "CONFIRMADO" as const, confirmed_at: new Date().toISOString(), confirmation_code: data as string, validation_hash: validationHash, payment_status: "PENDIENTE" as const };
      setPrediction(next);
      setPredictions((current) => current.map((row) => (row.id === next.id ? next : row)));
      setMessage("Pronostico confirmado. Escanee el QR de pago y espere la aprobacion del administrador para participar oficialmente.");
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
            <p><b>Pago:</b> <Badge>{paymentApproved ? "APROBADO" : prediction?.status === "CONFIRMADO" ? "PENDIENTE" : "Pendiente"}</Badge></p>
            <p><b>Confirmacion:</b> {formatDateTime(prediction?.confirmed_at)}</p>
            <p><b>Codigo:</b> {prediction?.confirmation_code ?? "Pendiente"}</p>
            <p><b>Pronostico:</b> #{prediction?.prediction_slot ?? 1}</p>
            <p><b>Cupos:</b> {predictions.length} de {maxPredictions}</p>
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
        <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-1 text-sm font-semibold">
            <span>Pronosticos del participante</span>
            <select
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={prediction?.id ?? ""}
              onChange={(event) => switchPrediction(event.target.value)}
            >
              {predictions.map((row) => (
                <option key={row.id} value={row.id}>
                  Pronostico #{row.prediction_slot ?? 1} - {row.status}{row.payment_status ? ` - Pago ${row.payment_status}` : ""}
                </option>
              ))}
              {!predictions.length && <option value="">Sin pronosticos creados</option>}
            </select>
          </label>
          <Button variant="outline" disabled={!canCreatePrediction} onClick={createAdditionalPrediction}><Plus size={16} /> Nuevo pronostico</Button>
        </CardContent>
      </Card>

      <Card className="border-primary/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy size={20} /> Premios y empates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-2">
            {prizes.split("\n").filter(Boolean).map((line) => (
              <div key={line} className="rounded-md border bg-white px-3 py-2 font-bold text-secondary">{line}</div>
            ))}
          </div>
          <p>
            El premio se entrega solo al primer lugar, segundo lugar y tercer lugar. Si dos o mas participantes terminan con el mismo puntaje final en una de esas posiciones, el monto de ese lugar se reparte en partes iguales entre quienes tengan ese puntaje.
          </p>
        </CardContent>
      </Card>

      {paymentApproved && (
        <Card className="border-secondary/40 bg-emerald-50">
          <CardContent className="space-y-3 pt-5">
            <h2 className="text-xl font-black text-secondary">FELICITACIONES YA ESTAS PARTICIPANDO EN EL MUNDIAL 2026 - INTERNO DE SEMAPA</h2>
            <p className="text-sm text-emerald-950">Tu pago fue aprobado por administracion. Unete al grupo oficial de WhatsApp para recibir comunicados del concurso.</p>
            <Button onClick={() => window.open(WHATSAPP_GROUP_URL, "_blank", "noopener,noreferrer")}><ExternalLink size={16} /> Unirme al grupo de WhatsApp</Button>
          </CardContent>
        </Card>
      )}

      {paymentPending && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Pago pendiente de aprobacion</CardTitle>
            <p className="text-sm text-muted-foreground">Escanee este QR, realice el pago de Bs70.00 y espere la aprobacion del administrador.</p>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-center">
            <div className="rounded-lg border bg-white p-3">
              {!paymentQrMissing ? (
                <img className="mx-auto w-full max-w-[340px]" src={PAYMENT_QR_URL} alt="QR de pago Banco Economico" onError={() => setPaymentQrMissing(true)} />
              ) : (
                <div className="rounded-md bg-muted p-6 text-center text-sm font-semibold text-muted-foreground">
                  Falta cargar la imagen public/payment-qr.jpeg en el proyecto.
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><b className="text-foreground">Monto:</b> Bs70.00</p>
              <p><b className="text-foreground">Motivo:</b> Polla Mundialista 2026</p>
              <p><b className="text-foreground">Estado:</b> Pendiente de revision administrativa</p>
              <p>Cuando el administrador confirme el pago, aparecera el mensaje de felicitacion y el enlace al grupo de WhatsApp.</p>
            </div>
          </CardContent>
        </Card>
      )}

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
