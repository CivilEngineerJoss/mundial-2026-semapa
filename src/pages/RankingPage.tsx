import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, Td, Th } from "../components/ui/table";
import { supabase } from "../lib/supabase";
import type { RankingRow } from "../lib/types";
import { formatDateTime } from "../lib/utils";

export function RankingPage() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [prizes, setPrizes] = useState("1° Lugar\n2° Lugar\n3° Lugar");

  useEffect(() => {
    supabase.from("rankings").select("*").order("position").limit(15).then(({ data }) => setRows((data as RankingRow[] | null) ?? []));
    supabase.from("settings").select("*").eq("key", "prizes_text").maybeSingle().then(({ data }) => {
      if (data?.value) setPrizes(data.value);
    });
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Medal size={22} /> Ranking general Top 15</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Posicion</Th>
                <Th>Nombre</Th>
                <Th>Pronostico</Th>
                <Th>Puntos</Th>
                <Th>Exactos</Th>
                <Th>Ganadores</Th>
                <Th>Aciertos</Th>
                <Th>Actualizacion</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.prediction_id ?? row.user_id}>
                  <Td className="font-black text-primary">#{row.position}</Td>
                  <Td className="font-semibold">{row.full_name}</Td>
                  <Td>#{row.prediction_slot ?? 1}</Td>
                  <Td>{row.total_points}</Td>
                  <Td>{row.exact_scores}</Td>
                  <Td>{row.winner_hits}</Td>
                  <Td>{row.matches_hit}</Td>
                  <Td>{formatDateTime(row.updated_at)}</Td>
                </tr>
              ))}
              {!rows.length && <tr><Td colSpan={8} className="text-center text-muted-foreground">Ranking sin datos todavia.</Td></tr>}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Premios</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {prizes.split("\n").filter(Boolean).map((line) => (
            <div key={line} className="rounded-lg border bg-white p-4 font-bold text-secondary">{line}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
