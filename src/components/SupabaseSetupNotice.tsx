import { AlertTriangle, Database, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function SupabaseSetupNotice() {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <AlertTriangle size={22} /> Falta conectar Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          El registro con correo y contrasena necesita un proyecto real de Supabase y una anon/public key valida. La key debe copiarse desde Supabase y normalmente empieza con <b>eyJ</b> o <b>sb_publishable_</b>.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <Database className="mb-2 text-secondary" size={22} />
            <b className="text-foreground">1. Ejecutar la migracion</b>
            <p className="mt-1">En Supabase SQL Editor ejecute <b>supabase/migrations/20260607143000_initial_schema.sql</b>.</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <KeyRound className="mb-2 text-secondary" size={22} />
            <b className="text-foreground">2. Crear .env</b>
            <p className="mt-1">Copie <b>.env.example</b> como <b>.env</b> y complete URL + anon public key del proyecto.</p>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-white">
{`VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_APP_BASE_URL=http://127.0.0.1:5173/mundial-2026-semapa/`}
        </pre>
        <p>En Supabase, mantenga activo el proveedor <b>Email</b> en Authentication para permitir registro y recuperacion de contrasena.</p>
      </CardContent>
    </Card>
  );
}
