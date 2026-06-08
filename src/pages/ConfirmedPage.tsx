import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, Td, Th } from "../components/ui/table";
import { getGroupStageMatches } from "../lib/matches";
import { generatePredictionPdf } from "../lib/pdf";
import { supabase } from "../lib/supabase";
import type { Match, Prediction, PredictionDetail, UserProfile } from "../lib/types";
import { formatDateTime } from "../lib/utils";

type ConfirmedRow = {
  prediction_id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  confirmed_at: string;
  confirmation_code: string | null;
  validation_hash: string | null;
  status: string;
};

export function ConfirmedPage() {
  const [rows, setRows] = useState<ConfirmedRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.rpc("get_confirmed_predictions_public").then(({ data, error }) => {
      if (error) setMessage(error.message);
      setRows((data as ConfirmedRow[] | null) ?? []);
    });
  }, []);

  const downloadPdf = async (row: ConfirmedRow) => {
    setMessage("");
    const [matchesRes, detailsRes] = await Promise.all([
      supabase.from("matches").select("*").lte("match_number", 72).order("sort_order"),
      supabase.rpc("get_confirmed_prediction_details_public", { p_prediction_id: row.prediction_id }),
    ]);

    if (matchesRes.error || detailsRes.error) {
      setMessage(matchesRes.error?.message ?? detailsRes.error?.message ?? "No se pudo generar el PDF.");
      return;
    }

    const profile: UserProfile = {
      id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      role: "user",
      created_at: row.created_at,
    };
    const prediction: Prediction = {
      id: row.prediction_id,
      user_id: row.user_id,
      status: "CONFIRMADO",
      confirmed_at: row.confirmed_at,
      confirmation_code: row.confirmation_code,
      validation_hash: row.validation_hash,
      ip_address: null,
      user_agent: null,
    };

    await generatePredictionPdf({
      profile,
      prediction,
      matches: getGroupStageMatches((matchesRes.data as Match[] | null) ?? []),
      details: (detailsRes.data as PredictionDetail[] | null) ?? [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pronosticos confirmados</CardTitle>
        <p className="text-sm text-muted-foreground">Transparencia publica con comprobantes PDF de los pronosticos confirmados.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {message && <div className="mb-3 rounded-md border bg-muted p-3 text-sm font-semibold text-muted-foreground">{message}</div>}
        <Table>
          <thead><tr><Th>Nombre</Th><Th>Fecha de confirmacion</Th><Th>Estado</Th><Th>PDF</Th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.prediction_id}>
                <Td className="font-semibold">{row.full_name}</Td>
                <Td>{formatDateTime(row.confirmed_at)}</Td>
                <Td>{row.status}</Td>
                <Td><Button variant="outline" size="sm" onClick={() => downloadPdf(row)}><Download size={16} /> Ver PDF</Button></Td>
              </tr>
            ))}
            {!rows.length && <tr><Td colSpan={4} className="text-center text-muted-foreground">Aun no hay pronosticos confirmados.</Td></tr>}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
