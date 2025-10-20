-- sql/transactions.sql

-- ==========================================
-- TRANSAÇÕES - Database Schema
-- Execute este script no Supabase SQL Editor
-- ==========================================

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type category_type NOT NULL, -- 'expense' ou 'income'
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  income_category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- Fonte (apenas para despesas)
  observation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: income_category_id só pode existir para despesas
  CONSTRAINT income_category_only_for_expenses 
    CHECK (type = 'expense' OR income_category_id IS NULL)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNÇÃO: Validar orçamento antes de inserir despesa
-- ==========================================
CREATE OR REPLACE FUNCTION check_budget_before_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_amount DECIMAL(10, 2);
  v_spent_amount DECIMAL(10, 2);
  v_category_name VARCHAR(100);
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Só valida se for despesa
  IF NEW.type = 'expense' THEN
    v_year := EXTRACT(YEAR FROM NEW.date);
    v_month := EXTRACT(MONTH FROM NEW.date);
    
    -- Buscar orçamento da categoria para o mês/ano da transação
    SELECT cb.budget_amount, cb.spent_amount, c.name
    INTO v_budget_amount, v_spent_amount, v_category_name
    FROM category_budgets cb
    JOIN categories c ON c.id = cb.category_id
    WHERE cb.category_id = NEW.category_id
      AND cb.year = v_year
      AND cb.month = v_month;
    
    -- Se a categoria tem orçamento definido, validar
    IF v_budget_amount IS NOT NULL THEN
      -- Calcular gasto após esta transação
      IF (v_spent_amount + NEW.amount) > v_budget_amount THEN
        RAISE EXCEPTION 'Orçamento excedido! A categoria "%" tem orçamento de R$ % e já possui R$ % gastos. Esta despesa de R$ % ultrapassaria o limite.',
          v_category_name,
          v_budget_amount,
          v_spent_amount,
          NEW.amount;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE INSERT para validar orçamento
DROP TRIGGER IF EXISTS trigger_check_budget_before_expense ON transactions;
CREATE TRIGGER trigger_check_budget_before_expense
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION check_budget_before_expense();

-- ==========================================
-- FUNÇÃO: Atualizar orçamentos e saldos após transação
-- ==========================================
CREATE OR REPLACE FUNCTION update_budgets_and_balances()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Determinar ano e mês da transação (INSERT usa NEW, DELETE usa OLD)
  IF TG_OP = 'DELETE' THEN
    v_year := EXTRACT(YEAR FROM OLD.date);
    v_month := EXTRACT(MONTH FROM OLD.date);
  ELSE
    v_year := EXTRACT(YEAR FROM NEW.date);
    v_month := EXTRACT(MONTH FROM NEW.date);
  END IF;

  -- ============================
  -- INSERÇÃO DE TRANSAÇÃO
  -- ============================
  IF TG_OP = 'INSERT' THEN
    -- Se for DESPESA: atualizar spent_amount em category_budgets
    IF NEW.type = 'expense' THEN
      -- Garantir que existe um registro em category_budgets para este mês
      INSERT INTO category_budgets (category_id, user_id, year, month, budget_amount, spent_amount)
      SELECT NEW.category_id, NEW.user_id, v_year, v_month, c.monthly_budget, 0
      FROM categories c
      WHERE c.id = NEW.category_id
      ON CONFLICT (category_id, year, month) DO NOTHING;
      
      -- Incrementar spent_amount
      UPDATE category_budgets
      SET spent_amount = spent_amount + NEW.amount,
          updated_at = NOW()
      WHERE category_id = NEW.category_id
        AND year = v_year
        AND month = v_month;
      
      -- Atualizar current_balance da categoria de despesa
      UPDATE categories
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.category_id;
    
    -- Se for RECEITA: atualizar balance_amount em category_balances
    ELSIF NEW.type = 'income' THEN
      -- Garantir que existe um registro em category_balances para este mês
      INSERT INTO category_balances (category_id, user_id, year, month, balance_amount)
      VALUES (NEW.category_id, NEW.user_id, v_year, v_month, 0)
      ON CONFLICT (category_id, year, month) DO NOTHING;
      
      -- Incrementar balance_amount
      UPDATE category_balances
      SET balance_amount = balance_amount + NEW.amount,
          updated_at = NOW()
      WHERE category_id = NEW.category_id
        AND year = v_year
        AND month = v_month;
      
      -- Atualizar current_balance da categoria de receita
      UPDATE categories
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.category_id;
    END IF;
  
  -- ============================
  -- DELEÇÃO DE TRANSAÇÃO
  -- ============================
  ELSIF TG_OP = 'DELETE' THEN
    -- Se for DESPESA: decrementar spent_amount
    IF OLD.type = 'expense' THEN
      UPDATE category_budgets
      SET spent_amount = GREATEST(spent_amount - OLD.amount, 0),
          updated_at = NOW()
      WHERE category_id = OLD.category_id
        AND year = v_year
        AND month = v_month;
      
      -- Atualizar current_balance da categoria de despesa
      UPDATE categories
      SET current_balance = GREATEST(current_balance - OLD.amount, 0),
          updated_at = NOW()
      WHERE id = OLD.category_id;
    
    -- Se for RECEITA: decrementar balance_amount
    ELSIF OLD.type = 'income' THEN
      UPDATE category_balances
      SET balance_amount = GREATEST(balance_amount - OLD.amount, 0),
          updated_at = NOW()
      WHERE category_id = OLD.category_id
        AND year = v_year
        AND month = v_month;
      
      -- Atualizar current_balance da categoria de receita
      UPDATE categories
      SET current_balance = GREATEST(current_balance - OLD.amount, 0),
          updated_at = NOW()
      WHERE id = OLD.category_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger AFTER INSERT/DELETE para atualizar orçamentos e saldos
DROP TRIGGER IF EXISTS trigger_update_budgets_and_balances ON transactions;
CREATE TRIGGER trigger_update_budgets_and_balances
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_budgets_and_balances();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);