# MUNDIAL 2026 - SEMAPA

Aplicacion web profesional para administrar una Polla Mundialista interna con React, Vite, TypeScript, TailwindCSS, componentes estilo ShadCN, Supabase Auth/PostgreSQL y despliegue gratuito en GitHub Pages.

## Funcionalidades

- Registro, inicio de sesion y recuperacion de contrasena con Supabase Auth.
- Pronostico unico de los 72 partidos de fase de grupos del Mundial FIFA 2026.
- Estados BORRADOR, CONFIRMADO y BLOQUEADO POR FECHA.
- Confirmacion irreversible con fecha, navegador, IP capturada por Supabase, codigo unico y hash.
- Comprobante PDF con QR de validacion.
- Panel de usuario con perfil, puntaje y posicion.
- Ranking Top 15 en tiempo real.
- Pagina publica de pronosticos confirmados sin mostrar marcadores.
- Panel administrativo para usuarios, partidos, resultados oficiales, premios y dashboard.
- Auditoria en `audit_logs`.
- RLS para aislar datos de usuarios y acceso total de administradores.
- GitHub Actions listo para publicar en GitHub Pages.

## Instalacion local

```bash
npm install
npm run dev
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure `.env` con datos reales de Supabase:

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_APP_BASE_URL=https://usuario.github.io/mundial-2026-semapa/
```

## Supabase

1. Cree un proyecto en Supabase.
2. Abra SQL Editor.
3. Ejecute `supabase/migrations/20260607143000_initial_schema.sql`.
4. En Authentication > Providers active Email.
5. En Authentication > URL Configuration agregue como redirect URL:

```text
https://usuario.github.io/mundial-2026-semapa/
https://usuario.github.io/mundial-2026-semapa/?reset-password=1
http://localhost:5173/
http://localhost:5173/?reset-password=1
```

Para recuperacion de contrasena, configure tambien Site URL con la URL publicada, por ejemplo:

```text
https://usuario.github.io/mundial-2026-semapa/
```

6. Cree el primer usuario desde la app.
7. Promueva al administrador en SQL:

```sql
update public.users
set role = 'admin'
where email = 'TU_CORREO_ADMIN@dominio.com';
```

No existe un usuario administrador por defecto. Cree primero una cuenta normal desde la app, luego ejecute el `update` anterior cambiando el correo por el suyo. La contrasena del administrador sera la misma que eligio al registrarse.

## Reglas de puntuacion

- Marcador exacto: 3 puntos.
- Ganador o empate acertado sin marcador exacto: 1 punto.
- Error: 0 puntos.
- El marcador exacto no suma punto adicional.

El recalculo se ejecuta desde la funcion `register_result` cada vez que el administrador registra o edita un resultado.

## Fecha limite

La fecha se guarda en `settings.deadline_iso`:

```text
2026-06-11T13:00:00-04:00
```

Corresponde al 11 de junio de 2026, 13:00 horas de Bolivia. Puede ajustarse desde SQL si SEMAPA cambia el reglamento.

## Despliegue GitHub Pages

1. Suba el repositorio a GitHub con nombre `mundial-2026-semapa`.
2. En Settings > Pages seleccione GitHub Actions.
3. En Settings > Secrets and variables > Actions agregue:

Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Variables:

- `VITE_APP_BASE_URL=https://usuario.github.io/mundial-2026-semapa/`

4. Haga push a `main`. El workflow `.github/workflows/deploy.yml` publicara `dist`.

## Estructura

```text
src/
  components/      UI, layout, auth provider y rutas protegidas
  data/            partidos iniciales
  lib/             Supabase, tipos, puntuacion, PDF y utilidades
  pages/           Login, perfil, ranking, transparencia, admin
supabase/
  migrations/      esquema PostgreSQL, RLS, RPC y seed
```

## Fuente de calendario

La app queda configurada solo para fase de grupos: 12 grupos, 72 partidos. Los partidos eliminatorios fueron retirados del flujo por decision del concurso SEMAPA.
