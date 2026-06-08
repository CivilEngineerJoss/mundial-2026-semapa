import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, RefreshCw, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, Td, Th } from "../components/ui/table";
import { TeamLabel } from "../components/TeamLabel";
import { useAuth } from "../components/AuthProvider";
import { getMatchSchedule } from "../data/matchSchedule";
import { supabase } from "../lib/supabase";
import type { Match, RankingRow, Result, UserProfile } from "../lib/types";
import { formatDateTime } from "../lib/utils";
import { getGroupStageMatches, getGroups } from "../lib/matches";

type Dashboard = {
  registered: number;
  confirmed: number;
  pending: number;
  played: number;
  pending_matches: number;
};

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>({ registered: 0, confirmed: 0, pending: 0, played: 0, pending_matches: 0 });
  const [query, setQuery] = useState("");
  const [prizes, setPrizes] = useState("");
  const [message, setMessage] = useState("");
  const [newMatch, setNewMatch] = useState({ phase: "Fase de grupos", group_name: "", team_a: "", team_b: "" });
  const [resultDrafts, setResultDrafts] = useState<Record<number, { goals_a: string; goals_b: string }>>({});
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const filteredUsers = useMemo(() => users.filter((user) => `${user.full_name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  const load = async () => {
    const [usersRes, matchesRes, rankingRes, settingsRes, dashboardRes, resultsRes] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("matches").select("*").lte("match_number", 72).order("sort_order"),
      supabase.from("rankings").select("*").order("position").limit(15),
      supabase.from("settings").select("*").eq("key", "prizes_text").maybeSingle(),
      supabase.rpc("admin_dashboard"),
      supabase.from("results").select("match_id,goals_a,goals_b,registered_at"),
    ]);
    setUsers((usersRes.data as UserProfile[] | null) ?? []);
    setMatches(getGroupStageMatches((matchesRes.data as Match[] | null) ?? []));
    setRanking((rankingRes.data as RankingRow[] | null) ?? []);
    setPrizes(settingsRes.data?.value ?? "1° Lugar\n2° Lugar\n3° Lugar");
    if (dashboardRes.data) setDashboard(dashboardRes.data as Dashboard);
    setResultDrafts(
      Object.fromEntries(
        ((resultsRes.data as Result[] | null) ?? []).map((result) => [
          result.match_id,
          { goals_a: String(result.goals_a), goals_b: String(result.goals_b) },
        ]),
      ),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const saveResult = async (event: FormEvent<HTMLFormElement>, match: Match) => {
    event.preventDefault();
    const draft = resultDrafts[match.id] ?? { goals_a: "", goals_b: "" };
    if (draft.goals_a === "" || draft.goals_b === "") {
      setMessage(`Ingrese los goles oficiales del partido #${match.match_number} antes de guardar el resultado.`);
      return;
    }
    const goalsA = Number(draft.goals_a);
    const goalsB = Number(draft.goals_b);
    const { error } = await supabase.rpc("register_result", { p_match_id: match.id, p_goals_a: goalsA, p_goals_b: goalsB });
    setMessage(error ? error.message : `Resultado oficial del partido #${match.match_number} guardado correctamente. Puntajes y ranking recalculados.`);
    await load();
  };

  const updateResultDraft = (matchId: number, field: "goals_a" | "goals_b", value: string) => {
    setResultDrafts((current) => ({
      ...current,
      [matchId]: {
        goals_a: current[matchId]?.goals_a ?? "",
        goals_b: current[matchId]?.goals_b ?? "",
        [field]: value,
      },
    }));
  };

  const updateMatch = async (match: Match) => {
    const { error } = await supabase.from("matches").update(match).eq("id", match.id);
    setMessage(error ? error.message : `Datos del partido #${match.match_number} actualizados correctamente.`);
    await load();
  };

  const createMatch = async () => {
    if (matches.length >= 72) {
      setMessage("El fixture oficial de fase de grupos ya tiene 72 partidos. No se crearon partidos adicionales.");
      return;
    }
    const nextNumber = Math.max(0, ...matches.map((match) => match.match_number)) + 1;
    const { error } = await supabase.from("matches").insert({
      match_number: nextNumber,
      sort_order: nextNumber,
      phase: newMatch.phase,
      group_name: newMatch.group_name || null,
      team_a: newMatch.team_a,
      team_b: newMatch.team_b,
    });
    setMessage(error ? error.message : "Partido creado.");
    setNewMatch({ phase: "Fase de grupos", group_name: "", team_a: "", team_b: "" });
    await load();
  };

  const deleteMatch = async (match: Match) => {
    if (!window.confirm(`Eliminar partido #${match.match_number}?`)) return;
    const { error } = await supabase.from("matches").delete().eq("id", match.id);
    setMessage(error ? error.message : "Partido eliminado.");
    await load();
  };

  const savePrizes = async () => {
    await supabase.from("settings").upsert({ key: "prizes_text", value: prizes });
    setMessage("Premios actualizados.");
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  };

  const resetPredictions = async (scope: "all" | "selected") => {
    const targetIds = scope === "selected" ? selectedUserIds : null;
    if (scope === "selected" && !selectedUserIds.length) {
      setMessage("Seleccione al menos un usuario para reiniciar sus predicciones.");
      return;
    }
    const label = scope === "all" ? "TODAS las predicciones de todos los usuarios" : "las predicciones de los usuarios seleccionados";
    if (!window.confirm(`Esta accion borrara ${label}. Los usuarios deberan llenar su pronostico nuevamente. Desea continuar?`)) return;

    setAdminActionLoading(true);
    const { error } = await supabase.rpc("admin_reset_predictions", { p_user_ids: targetIds });
    setAdminActionLoading(false);
    setMessage(error ? error.message : scope === "all" ? "Todas las predicciones fueron reiniciadas correctamente." : "Predicciones seleccionadas reiniciadas correctamente.");
    if (!error) setSelectedUserIds([]);
    await load();
  };

  const deleteSelectedUsers = async () => {
    const targetIds = selectedUserIds.filter((id) => id !== currentUser?.id);
    if (!targetIds.length) {
      setMessage("Seleccione usuarios para eliminar. Su propia cuenta administradora no se eliminara desde aqui.");
      return;
    }
    if (!window.confirm(`Eliminar ${targetIds.length} usuario(s) seleccionado(s)? Esta accion tambien borra sus predicciones.`)) return;

    setAdminActionLoading(true);
    const { error } = await supabase.rpc("admin_delete_users", { p_user_ids: targetIds });
    setAdminActionLoading(false);
    setMessage(error ? error.message : "Usuarios seleccionados eliminados correctamente.");
    if (!error) setSelectedUserIds([]);
    await load();
  };

  const exportUsers = () => {
    const csv = ["Nombre,Correo,Rol,Registro", ...users.map((u) => `"${u.full_name}","${u.email}","${u.role}","${u.created_at}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "usuarios-semapa.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-5">
        {[
          ["Usuarios", dashboard.registered],
          ["Confirmados", dashboard.confirmed],
          ["Pendientes", dashboard.pending],
          ["Jugados", dashboard.played],
          ["Por jugar", dashboard.pending_matches],
        ].map(([label, value]) => (
          <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-3xl font-black text-primary">{value}</CardContent></Card>
        ))}
      </section>

      {message && (
        <div className="flex items-start gap-2 rounded-md border border-secondary/30 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="mt-0.5 shrink-0 text-secondary" size={18} />
          <span>{message}</span>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Usuarios</CardTitle>
              <Button variant="outline" onClick={exportUsers}><Download size={16} /> Exportar</Button>
            </div>
            <Input placeholder="Buscar usuarios" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="grid gap-2 rounded-lg border bg-muted p-3 text-sm sm:grid-cols-3">
              <Button variant="outline" disabled={adminActionLoading} onClick={() => resetPredictions("all")}><RotateCcw size={16} /> Reiniciar todas</Button>
              <Button variant="outline" disabled={adminActionLoading || !selectedUserIds.length} onClick={() => resetPredictions("selected")}><RotateCcw size={16} /> Reiniciar seleccionados</Button>
              <Button variant="danger" disabled={adminActionLoading || !selectedUserIds.length} onClick={deleteSelectedUsers}><Trash2 size={16} /> Eliminar seleccionados</Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[460px] overflow-auto">
            <Table>
              <thead><tr><Th>Sel.</Th><Th>Nombre</Th><Th>Correo</Th><Th>Rol</Th><Th>Registro</Th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <Td>
                      <input
                        aria-label={`Seleccionar ${user.full_name}`}
                        checked={selectedUserIds.includes(user.id)}
                        className="h-4 w-4"
                        disabled={user.id === currentUser?.id}
                        type="checkbox"
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </Td>
                    <Td>{user.full_name}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.role}</Td>
                    <Td>{formatDateTime(user.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ranking en tiempo real</CardTitle></CardHeader>
          <CardContent className="max-h-[460px] overflow-auto">
            <Table>
              <thead><tr><Th>#</Th><Th>Nombre</Th><Th>Puntos</Th><Th>Exactos</Th></tr></thead>
              <tbody>{ranking.map((row) => <tr key={row.user_id}><Td>{row.position}</Td><Td>{row.full_name}</Td><Td>{row.total_points}</Td><Td>{row.exact_scores}</Td></tr>)}</tbody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Partidos y resultados oficiales</CardTitle>
            <Button variant="outline" onClick={load}><RefreshCw size={16} /> Recargar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 rounded-lg border bg-muted p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input placeholder="Fase" value={newMatch.phase} onChange={(e) => setNewMatch((current) => ({ ...current, phase: e.target.value }))} />
            <Input placeholder="Grupo" value={newMatch.group_name} onChange={(e) => setNewMatch((current) => ({ ...current, group_name: e.target.value }))} />
            <Input placeholder="Equipo A" value={newMatch.team_a} onChange={(e) => setNewMatch((current) => ({ ...current, team_a: e.target.value }))} />
            <Input placeholder="Equipo B" value={newMatch.team_b} onChange={(e) => setNewMatch((current) => ({ ...current, team_b: e.target.value }))} />
            <Button onClick={createMatch} disabled={!newMatch.team_a || !newMatch.team_b || matches.length >= 72}>Crear partido</Button>
          </div>
          <div className="grid gap-3 rounded-lg border bg-white p-4 text-sm text-muted-foreground md:grid-cols-3">
            <p><b className="text-foreground">Partido:</b> guarda cambios en los nombres de los equipos del partido.</p>
            <p><b className="text-foreground">Resultado:</b> registra goles oficiales y recalcula puntajes/ranking.</p>
            <p><b className="text-foreground">Eliminar:</b> borra el partido del concurso. Use solo si fue creado por error.</p>
          </div>
          <section className="space-y-5">
            <h3 className="text-xl font-black text-primary">Fase de grupos</h3>
            {getGroups(matches).map((groupName) => (
              <div key={groupName} className="space-y-3">
                <h4 className="rounded-md bg-muted px-3 py-2 text-sm font-black text-primary">{groupName}</h4>
                {matches.filter((match) => (match.group_name ?? "Sin grupo") === groupName).map((match, index) => {
                  const schedule = getMatchSchedule(match);
                  const teamA = schedule?.teamA ?? match.team_a;
                  const teamB = schedule?.teamB ?? match.team_b;
                  const resultDraft = resultDrafts[match.id] ?? { goals_a: "", goals_b: "" };
                  return (
                    <form key={match.id} onSubmit={(event) => saveResult(event, match)} className="grid gap-2 rounded-lg border bg-white p-3 lg:grid-cols-[70px_1fr_1fr_90px_90px_auto_auto_auto] lg:items-center">
                      <div className="text-xs font-bold text-muted-foreground">
                        <b className="block text-base text-primary">#{schedule?.matchNumber ?? match.match_number}</b>
                        <span>{schedule?.date ?? "-"}</span>
                        <span className="block">{schedule?.time ?? "-"}</span>
                        <span className="block truncate" title={schedule?.venue ?? match.venue ?? ""}>{schedule?.venue ?? match.venue ?? "-"}</span>
                      </div>
                      <div className="space-y-1">
                        <TeamLabel team={teamA} />
                        <Input value={match.team_a} onChange={(e) => setMatches((rows) => rows.map((row) => (row.id === match.id ? { ...row, team_a: e.target.value } : row)))} />
                      </div>
                      <div className="space-y-1">
                        <TeamLabel team={teamB} />
                        <Input value={match.team_b} onChange={(e) => setMatches((rows) => rows.map((row) => (row.id === match.id ? { ...row, team_b: e.target.value } : row)))} />
                      </div>
                      <Input
                        name="goals_a"
                        type="number"
                        min={0}
                        max={99}
                        placeholder="Goles A"
                        value={resultDraft.goals_a}
                        onChange={(event) => updateResultDraft(match.id, "goals_a", event.target.value)}
                      />
                      <Input
                        name="goals_b"
                        type="number"
                        min={0}
                        max={99}
                        placeholder="Goles B"
                        value={resultDraft.goals_b}
                        onChange={(event) => updateResultDraft(match.id, "goals_b", event.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={() => updateMatch(match)}><Save size={16} /> Partido</Button>
                      <Button type="submit">Resultado</Button>
                      <Button type="button" variant="danger" onClick={() => deleteMatch(match)}>Eliminar</Button>
                    </form>
                  );
                })}
              </div>
            ))}
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Premios</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={prizes} onChange={(e) => setPrizes(e.target.value)} />
          <Button onClick={savePrizes}><Save size={16} /> Guardar premios</Button>
        </CardContent>
      </Card>
    </div>
  );
}
