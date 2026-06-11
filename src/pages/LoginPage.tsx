import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../components/AuthProvider";
import { SupabaseSetupNotice } from "../components/SupabaseSetupNotice";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function LoginPage() {
  const { user, passwordRecovery } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (passwordRecovery) return <Navigate to="/reset-password" replace />;
  if (user) return <Navigate to="/" replace />;
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const appBaseUrl = (import.meta.env.VITE_APP_BASE_URL as string | undefined) || `${window.location.origin}${import.meta.env.BASE_URL}`;
    const baseUrl = appBaseUrl.endsWith("/") ? appBaseUrl : `${appBaseUrl}/`;
    const authRedirectTo = baseUrl;
    const resetRedirectTo = `${baseUrl}?reset-password=1`;
    const result =
      mode === "register"
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: authRedirectTo } })
        : mode === "recover"
          ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetRedirectTo })
          : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) setMessage(result.error.message);
    else setMessage(mode === "recover" ? "Revise su correo para recuperar la contrasena." : "Operacion completada.");
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-[1fr_420px] md:items-center">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-secondary">SEMAPA</p>
        <h2 className="mt-3 text-4xl font-black leading-tight text-primary md:text-5xl">MUNDIAL 2026 - SEMAPA</h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Registre un unico pronostico completo para los 72 partidos de fase de grupos, confirme antes del 11 de junio de 2026 a las 15:00 de Bolivia y descargue su comprobante oficial.
        </p>
        <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
          {["72 partidos", "PDF con QR", "Ranking general"].map((item) => (
            <div key={item} className="rounded-lg border bg-white p-4 font-bold text-primary shadow-soft">
              {item}
            </div>
          ))}
        </div>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "register" ? "Crear cuenta" : mode === "recover" ? "Recuperar acceso" : "Iniciar sesion"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            {mode === "register" && <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" required />}
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electronico" required />
            {mode !== "recover" && <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contrasena" minLength={6} required />}
            <Button className="w-full" disabled={loading}>
              <ShieldCheck size={17} /> {loading ? "Procesando..." : "Continuar"}
            </Button>
          </form>
          {message && <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <button className="font-bold text-primary" onClick={() => setMode(mode === "register" ? "login" : "register")}>
              {mode === "register" ? "Ya tengo cuenta" : "Crear cuenta"}
            </button>
            <button className="font-bold text-primary" onClick={() => setMode("recover")}>
              Recuperar contrasena
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
