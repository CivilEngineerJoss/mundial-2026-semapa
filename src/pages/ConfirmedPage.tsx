import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, Td, Th } from "../components/ui/table";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../lib/utils";

type ConfirmedRow = {
  full_name: string;
  confirmed_at: string;
  status: string;
};

export function ConfirmedPage() {
  const [rows, setRows] = useState<ConfirmedRow[]>([]);

  useEffect(() => {
    supabase.from("confirmed_predictions").select("*").order("confirmed_at", { ascending: false }).then(({ data }) => setRows((data as ConfirmedRow[] | null) ?? []));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pronosticos confirmados</CardTitle>
        <p className="text-sm text-muted-foreground">Transparencia publica sin revelar marcadores pronosticados.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <thead><tr><Th>Nombre</Th><Th>Fecha de confirmacion</Th><Th>Estado</Th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.full_name}-${row.confirmed_at}`}>
                <Td className="font-semibold">{row.full_name}</Td>
                <Td>{formatDateTime(row.confirmed_at)}</Td>
                <Td>{row.status}</Td>
              </tr>
            ))}
            {!rows.length && <tr><Td colSpan={3} className="text-center text-muted-foreground">Aun no hay pronosticos confirmados.</Td></tr>}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
