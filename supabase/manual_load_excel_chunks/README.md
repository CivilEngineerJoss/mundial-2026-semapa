# Carga manual de ANALISIS_corregido.xlsx

Ejecutar estos archivos en Supabase SQL Editor en orden numerico.

1. `00_cargar_partidos.sql`
2. `01_predicciones_0001_0080.sql`
3. `02_predicciones_0081_0160.sql`
4. Continuar con todos los archivos `03_...` hasta `24_...`
5. `99_final_limpiar_y_recalcular.sql`

Cada archivo tiene menos de 100 lineas para poder copiarlo y pegarlo en Supabase SQL Editor.

No ejecutar migraciones antiguas de restauracion o sincronizacion de fixture despues de esta carga.
