-- Migration: Add pause reasons table and update production_pauses
-- File: 0005_add_pause_reasons.sql

-- Create pause_reasons table
CREATE TABLE pause_reasons (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Add pause_reason_id column to production_pauses
ALTER TABLE production_pauses 
ADD COLUMN pause_reason_id INTEGER REFERENCES pause_reasons(id);

-- Make reason column optional (remove NOT NULL constraint)
ALTER TABLE production_pauses 
ALTER COLUMN reason DROP NOT NULL;

-- Insert default pause reasons
INSERT INTO pause_reasons (name, description) VALUES 
('Banheiro', 'Pausa para necessidades fisiológicas'),
('Refeição', 'Pausa para almoço ou lanche'),
('Troca de Matriz', 'Pausa para troca de matriz de produção'),
('Manutenção', 'Pausa para manutenção preventiva ou corretiva'),
('Reunião', 'Pausa para participação em reuniões'),
('Descanso', 'Pausa para descanso programado'),
('Problema Técnico', 'Pausa devido a problemas técnicos na produção'),
('Falta de Material', 'Pausa por falta de matéria-prima'),
('Outros', 'Outros motivos não listados');

-- Create index for better performance
CREATE INDEX idx_production_pauses_pause_reason_id ON production_pauses(pause_reason_id);
CREATE INDEX idx_pause_reasons_is_active ON pause_reasons(is_active);