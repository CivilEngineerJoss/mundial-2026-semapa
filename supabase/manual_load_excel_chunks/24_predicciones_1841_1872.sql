-- 24 - Predicciones corregidas filas 1841 a 1872 de 1872.
-- Ejecutar despues de 00_cargar_partidos.sql, respetando el orden numerico.
with corrected_details(id, prediction_id, match_id, predicted_goals_a, predicted_goals_b) as (
  values
    ('0da9394b-8ab9-47aa-834b-4cfb71d852e2'::uuid, '11c49ffa-7134-41b0-bb05-e782c7443f2e'::uuid, 71, 2, 0),
    ('df6946ac-fa23-49d9-8ac6-65b001eeb07b'::uuid, 'd3750751-9175-4dc7-b321-6192ec933deb'::uuid, 71, 0, 3),
    ('de8a76aa-b621-4a80-b423-e24dc3c2794b'::uuid, '540267b1-b0a3-4649-a730-a46ae6ae7e5b'::uuid, 71, 0, 2),
    ('0e5d76c3-6f87-445f-bb91-3ce33bf1badc'::uuid, '6d9d7c4f-6de9-46f6-bc65-3e575355e7bd'::uuid, 71, 0, 3),
    ('8d7b7c04-c645-42d7-85b7-ebf7c1bde602'::uuid, '2f6455f7-dd5b-4284-ad65-4d891c972e85'::uuid, 71, 1, 3),
    ('363fbdcd-3850-43ff-be95-d15e0ca4b0b4'::uuid, 'a7280676-ad7a-4be4-878c-4b872f346704'::uuid, 71, 0, 3),
    ('b546eda6-a589-4af8-af32-384bb8003705'::uuid, 'cd4827c5-9ac3-4638-8f90-894e85b037b3'::uuid, 72, 2, 1),
    ('897ef514-21c2-4eeb-ad5b-8e4f0e9909e3'::uuid, '84ecaa5b-9883-43ba-ae82-9152e038c4dd'::uuid, 72, 2, 0),
    ('f35adefb-6429-4610-83d6-cf717f77b36c'::uuid, 'd2d94452-07ad-45e7-8623-6db184ec532e'::uuid, 72, 3, 0),
    ('4df4198a-5749-4f13-81f0-55867cfc7004'::uuid, '03a97f5c-af2d-4d1c-bd82-f5b2d2e39c80'::uuid, 72, 2, 0),
    ('8d89c041-769d-45b6-9ce3-8fe32070ba07'::uuid, '5f784391-b390-4b88-b7ef-bdb5ca0b2d68'::uuid, 72, 1, 1),
    ('476f047e-8dfe-4871-b318-4cc4289cc9da'::uuid, 'cecc03e4-61c3-407e-8571-ad1ce7965342'::uuid, 72, 1, 0),
    ('f9743872-74ae-4705-8946-57f6fb28661a'::uuid, '5b949a6a-a4e7-4b70-bb85-80f23c85ed29'::uuid, 72, 2, 1),
    ('0828a82d-82d2-4073-8360-8b362cbe7bda'::uuid, '001f3f9b-52a7-43f4-830a-4864d7b70efe'::uuid, 72, 2, 1),
    ('11452e2c-c347-4411-b1ca-848e7c357ae4'::uuid, '52e82754-e899-4c84-88bc-d98918177f43'::uuid, 72, 2, 1),
    ('153eee84-e771-483a-9aa3-9a56f4175c3f'::uuid, '70fd7901-3e33-4adc-b785-c834f4d65298'::uuid, 72, 1, 0),
    ('95077b67-7682-44d3-b581-7417ce941a87'::uuid, '7da5e6be-ee9c-4d25-b7f2-3642a3c62892'::uuid, 72, 2, 0),
    ('fe7ab627-196a-42ce-b129-dcf4a0b6eec4'::uuid, 'f97919b5-c289-41d4-b58f-7528f0c1b447'::uuid, 72, 3, 2),
    ('c8bd93d9-eebf-4c3c-860e-8de2c928296a'::uuid, '19d5d7d4-63ae-4e71-9de4-beeff028ea61'::uuid, 72, 0, 1),
    ('31f365c5-bf46-4866-8a32-56cd8343368b'::uuid, '732d3b7b-1f53-44d8-9bbe-83120e81b10d'::uuid, 72, 2, 2),
    ('a0beab9b-3893-4bac-9326-d2a6c5428d42'::uuid, '1bfde90e-eab9-425c-b80d-a37de995b628'::uuid, 72, 1, 2),
    ('8d6bf5c4-33a2-4c01-aa4c-2d5319995c95'::uuid, '043b1965-8317-4dcf-a3aa-c93b1039d27a'::uuid, 72, 3, 2),
    ('7991c7e0-b17c-4d93-b9ce-4bfe20e840e7'::uuid, '47f4f1ac-b1db-4c3f-9651-3b9ccca22733'::uuid, 72, 4, 0),
    ('0d249b83-3c61-458b-ba07-4306474c45ba'::uuid, 'b84a44e2-4aa4-44a2-a75a-7103049136ad'::uuid, 72, 2, 1),
    ('46159b31-997e-452f-9e07-8fcf75e88d00'::uuid, '3ba54b4f-4bba-4c50-af4c-96a71b38122a'::uuid, 72, 1, 1),
    ('182529b2-4d1a-4bb7-aa35-e55ed2d56f69'::uuid, 'e3f7c585-8141-4876-aeab-91bf9edda6a3'::uuid, 72, 1, 1),
    ('6f38a042-112f-4e27-9024-c8ef9c31324f'::uuid, '11c49ffa-7134-41b0-bb05-e782c7443f2e'::uuid, 72, 1, 1),
    ('975c1667-a114-4fd3-bcf6-2f6814f84c18'::uuid, 'd3750751-9175-4dc7-b321-6192ec933deb'::uuid, 72, 2, 1),
    ('4439b229-482f-42b4-8dee-2c8150688c8e'::uuid, '540267b1-b0a3-4649-a730-a46ae6ae7e5b'::uuid, 72, 2, 0),
    ('0ebc4a10-9c49-486c-a7b4-452529c870a8'::uuid, '6d9d7c4f-6de9-46f6-bc65-3e575355e7bd'::uuid, 72, 1, 1),
    ('5ef50ad1-3e81-4393-a981-f5b94284915f'::uuid, '2f6455f7-dd5b-4284-ad65-4d891c972e85'::uuid, 72, 2, 0),
    ('4cb8c2d9-9118-4ca8-ad5e-dbef1d7a1e25'::uuid, 'a7280676-ad7a-4be4-878c-4b872f346704'::uuid, 72, 2, 1)
)
insert into public.prediction_details(id, prediction_id, match_id, predicted_goals_a, predicted_goals_b, updated_at)
select id, prediction_id, match_id, predicted_goals_a, predicted_goals_b, now()
from corrected_details
on conflict (prediction_id, match_id) do update set
  id = excluded.id,
  predicted_goals_a = excluded.predicted_goals_a,
  predicted_goals_b = excluded.predicted_goals_b,
  updated_at = now();
