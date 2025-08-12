-- Adicionar campos para rastrear mudanças de matriz e material durante pausas/retomadas
ALTER TABLE "production_pauses" ADD COLUMN "new_matrix_id" integer;
ALTER TABLE "production_pauses" ADD COLUMN "new_material_id" integer;

-- Adicionar constraints para referenciar as tabelas
ALTER TABLE "production_pauses" ADD CONSTRAINT "production_pauses_new_matrix_id_matrices_id_fk" 
FOREIGN KEY ("new_matrix_id") REFERENCES "public"."matrices"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "production_pauses" ADD CONSTRAINT "production_pauses_new_material_id_raw_materials_id_fk" 
FOREIGN KEY ("new_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;

-- Adicionar coluna para material selecionado nas sessões de produção
ALTER TABLE "production_sessions" ADD COLUMN "selected_material_id" integer;

-- Adicionar constraint para referenciar raw_materials
ALTER TABLE "production_sessions" ADD CONSTRAINT "production_sessions_selected_material_id_raw_materials_id_fk" 
FOREIGN KEY ("selected_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;