import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function ValidationPage() {
  const { code } = useParams();
  return (
    <Card>
      <CardHeader><CardTitle>Validacion de comprobante</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Codigo unico:</p>
        <p className="mt-2 text-2xl font-black text-primary">{code}</p>
        <p className="mt-4 text-muted-foreground">Este codigo corresponde a un pronostico confirmado en MUNDIAL 2026 - SEMAPA. La verificacion administrativa se realiza contra la tabla de pronosticos confirmados en Supabase.</p>
      </CardContent>
    </Card>
  );
}
