-- FINAL - Ejecutar al terminar todos los bloques de predicciones.
-- Limpia filas extra de esas predicciones y recalcula ranking.
with corrected_predictions(prediction_id) as (
  values
    ('001f3f9b-52a7-43f4-830a-4864d7b70efe'::uuid),
    ('03a97f5c-af2d-4d1c-bd82-f5b2d2e39c80'::uuid),
    ('043b1965-8317-4dcf-a3aa-c93b1039d27a'::uuid),
    ('11c49ffa-7134-41b0-bb05-e782c7443f2e'::uuid),
    ('19d5d7d4-63ae-4e71-9de4-beeff028ea61'::uuid),
    ('1bfde90e-eab9-425c-b80d-a37de995b628'::uuid),
    ('2f6455f7-dd5b-4284-ad65-4d891c972e85'::uuid),
    ('3ba54b4f-4bba-4c50-af4c-96a71b38122a'::uuid),
    ('47f4f1ac-b1db-4c3f-9651-3b9ccca22733'::uuid),
    ('52e82754-e899-4c84-88bc-d98918177f43'::uuid),
    ('540267b1-b0a3-4649-a730-a46ae6ae7e5b'::uuid),
    ('5b949a6a-a4e7-4b70-bb85-80f23c85ed29'::uuid),
    ('5f784391-b390-4b88-b7ef-bdb5ca0b2d68'::uuid),
    ('6d9d7c4f-6de9-46f6-bc65-3e575355e7bd'::uuid),
    ('70fd7901-3e33-4adc-b785-c834f4d65298'::uuid),
    ('732d3b7b-1f53-44d8-9bbe-83120e81b10d'::uuid),
    ('7da5e6be-ee9c-4d25-b7f2-3642a3c62892'::uuid),
    ('84ecaa5b-9883-43ba-ae82-9152e038c4dd'::uuid),
    ('a7280676-ad7a-4be4-878c-4b872f346704'::uuid),
    ('b84a44e2-4aa4-44a2-a75a-7103049136ad'::uuid),
    ('cd4827c5-9ac3-4638-8f90-894e85b037b3'::uuid),
    ('cecc03e4-61c3-407e-8571-ad1ce7965342'::uuid),
    ('d2d94452-07ad-45e7-8623-6db184ec532e'::uuid),
    ('d3750751-9175-4dc7-b321-6192ec933deb'::uuid),
    ('e3f7c585-8141-4876-aeab-91bf9edda6a3'::uuid),
    ('f97919b5-c289-41d4-b58f-7528f0c1b447'::uuid)
)
delete from public.prediction_details pd
using corrected_predictions cp
where pd.prediction_id = cp.prediction_id
  and (pd.match_id < 1 or pd.match_id > 72);

select public.recalculate_rankings();
