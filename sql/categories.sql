-- sql/categories.sql

-- ==========================================
-- CATEGORIAS - Database Schema
-- Execute este script no Supabase SQL Editor
-- ==========================================

-- Enum para tipo de categoria
CREATE TYPE category_type AS ENUM ('income', 'expense');

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type category_type NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color format #RRGGBB
  monthly_budget DECIMAL(10, 2), -- Orçamento mensal (apenas para despesas)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de orçamentos mensais (histórico)
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  budget_amount DECIMAL(10, 2) NOT NULL,
  spent_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, year, month)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_category_budgets_category_id ON category_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_id ON category_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_category_budgets_period ON category_budgets(year, month);

-- Trigger para atualizar updated_at em categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em category_budgets
DROP TRIGGER IF EXISTS update_category_budgets_updated_at ON category_budgets;
CREATE TRIGGER update_category_budgets_updated_at
BEFORE UPDATE ON category_budgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para criar orçamento mensal automaticamente quando categoria de despesa é criada/atualizada com budget
CREATE OR REPLACE FUNCTION create_monthly_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'expense' AND NEW.monthly_budget IS NOT NULL AND NEW.monthly_budget > 0 THEN
    INSERT INTO category_budgets (
      category_id,
      user_id,
      year,
      month,
      budget_amount
    ) VALUES (
      NEW.id,
      NEW.user_id,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
      NEW.monthly_budget
    )
    ON CONFLICT (category_id, year, month) 
    DO UPDATE SET 
      budget_amount = NEW.monthly_budget,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar orçamento mensal
DROP TRIGGER IF EXISTS trigger_create_monthly_budget ON categories;
CREATE TRIGGER trigger_create_monthly_budget
AFTER INSERT OR UPDATE OF monthly_budget ON categories
FOR EACH ROW
EXECUTE FUNCTION create_monthly_budget();

-- Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- Policies para categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para category_budgets
CREATE POLICY "Users can view their own budgets"
  ON category_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON category_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON category_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON category_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Função auxiliar para obter total gasto de uma categoria no mês atual
CREATE OR REPLACE FUNCTION get_category_spent_amount(p_category_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  spent DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO spent
  FROM transactions
  WHERE category_id = p_category_id
    AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE);
  
  RETURN spent;
END;
$$ LANGUAGE plpgsql;