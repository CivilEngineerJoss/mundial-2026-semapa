import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Shield, Trophy, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import semapaLogo from "../assets/semapa-logo.png";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-white text-primary" : "text-white/88 hover:bg-white/12"}`;

export function Layout() {
  const { user, profile } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="stadium-band text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-4">
            <img src={semapaLogo} alt="SEMAPA somos vida" className="h-14 w-auto rounded-md bg-white p-1 shadow-soft md:h-16" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Polla Mundialista Interna</p>
              <h1 className="mt-1 text-2xl font-black leading-tight md:text-3xl">MUNDIAL 2026 - SEMAPA</h1>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navClass}>
              <UserRound size={16} className="inline" /> Perfil
            </NavLink>
            <NavLink to="/ranking" className={navClass}>
              <Trophy size={16} className="inline" /> Ranking
            </NavLink>
            <NavLink to="/confirmados" className={navClass}>
              Transparencia
            </NavLink>
            {profile?.role === "admin" && (
              <NavLink to="/admin" className={navClass}>
                <Shield size={16} className="inline" /> Admin
              </NavLink>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()} className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <LogOut size={16} /> Salir
              </Button>
            ) : (
              <NavLink to="/login" className={navClass}>
                Ingresar
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
