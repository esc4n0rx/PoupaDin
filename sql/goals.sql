-- sql/goals.sql

-- ==========================================
-- OBJETIVOS - Database Schema
-- Execute este script no Supabase SQL Editor
-- ==========================================

-- Tabela de objetivos
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10, 2), -- Meta financeira (opcional)
  current_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color format #RRGGBB
  icon VARCHAR(50) NOT NULL,
  deadline DATE, -- Prazo de vencimento (opcional)
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_is_completed ON goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para marcar objetivo como completo automaticamente
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se há meta definida e o saldo atual atingiu ou superou a meta
  IF NEW.target_amount IS NOT NULL AND NEW.current_amount >= NEW.target_amount THEN
    NEW.is_completed = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conclusão ao atualizar saldo
DROP TRIGGER IF EXISTS trigger_check_goal_completion ON goals;
CREATE TRIGGER trigger_check_goal_completion
BEFORE UPDATE OF current_amount ON goals
FOR EACH ROW
EXECUTE FUNCTION check_goal_completion();

-- Row Level Security (RLS)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);