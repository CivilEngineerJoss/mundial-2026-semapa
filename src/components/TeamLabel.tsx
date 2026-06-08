import { getTeamFlagUrl } from "../lib/flags";
import { cn } from "../lib/utils";

export function TeamLabel({ team, align = "left", className }: { team: string; align?: "left" | "right"; className?: string }) {
  const flagUrl = getTeamFlagUrl(team);
  const flag = flagUrl ? (
    <img className="h-5 w-7 shrink-0 rounded-sm border object-cover shadow-sm" src={flagUrl} alt="" loading="lazy" />
  ) : (
    <span className="flex h-5 w-7 shrink-0 items-center justify-center rounded-sm border bg-muted text-[10px] font-black text-muted-foreground">--</span>
  );
  return (
    <span className={cn("flex min-w-0 items-center gap-2 font-semibold", align === "right" && "justify-end text-right", className)} title={team}>
      {align === "right" ? (
        <>
          <span className="truncate">{team}</span>
          {flag}
        </>
      ) : (
        <>
          {flag}
          <span className="truncate">{team}</span>
        </>
      )}
    </span>
  );
}
