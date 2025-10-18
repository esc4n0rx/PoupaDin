// services/api/category.ts

/**
 * Category API Service
 */
import { ApiResponse } from '../../types/api';
import { Category, CategoryBudget, CategoryType, CategoryWithBudget, CreateCategoryDTO, UpdateCategoryDTO } from '../../types/category';
import { supabase } from '../supabase';

export const CategoryAPI = {
  /**
   * Listar categorias do usuário
   */
  getCategories: async (type?: CategoryType): Promise<ApiResponse<Category[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data: categories, error } = await query;

      if (error) {
        console.error('Get categories error:', error);
        return {
          success: false,
          error: 'Erro ao buscar categorias',
        };
      }

      return {
        success: true,
        data: categories as Category[],
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: 'Erro ao buscar categorias',
      };
    }
  },

  /**
   * Listar categorias com informações de orçamento
   */
  getCategoriesWithBudget: async (type?: CategoryType): Promise<ApiResponse<CategoryWithBudget[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      let query = supabase
        .from('categories')
        .select(`
          *,
          category_budgets!left (
            id,
            budget_amount,
            spent_amount,
            year,
            month
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get categories with budget error:', error);
        return {
          success: false,
          error: 'Erro ao buscar categorias',
        };
      }

      // Processar dados e calcular informações de orçamento
      const categoriesWithBudget: CategoryWithBudget[] = (data as any[]).map((cat) => {
        const currentBudget = cat.category_budgets?.find(
          (b: any) => b.year === currentYear && b.month === currentMonth
        );

        const category: CategoryWithBudget = {
          ...cat,
          category_budgets: undefined, // Remover do objeto final
        };

        if (currentBudget) {
          category.current_budget = currentBudget;
          category.spent_amount = currentBudget.spent_amount || 0;
          category.remaining_amount = currentBudget.budget_amount - (currentBudget.spent_amount || 0);
          category.budget_percentage = ((currentBudget.spent_amount || 0) / currentBudget.budget_amount) * 100;
        }

        return category;
      });

      return {
        success: true,
        data: categoriesWithBudget,
      };
    } catch (error) {
      console.error('Get categories with budget error:', error);
      return {
        success: false,
        error: 'Erro ao buscar categorias',
      };
    }
  },

  /**
   * Buscar categoria por ID
   */
  getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !category) {
        return {
          success: false,
          error: 'Categoria não encontrada',
        };
      }

      return {
        success: true,
        data: category as Category,
      };
    } catch (error) {
      console.error('Get category error:', error);
      return {
        success: false,
        error: 'Erro ao buscar categoria',
      };
    }
  },

  /**
   * Criar nova categoria
   */
  createCategory: async (data: CreateCategoryDTO): Promise<ApiResponse<Category>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
          monthly_budget: data.type === 'expense' ? data.monthly_budget : null,
        })
        .select()
        .single();

      if (error || !category) {
        console.error('Create category error:', error);
        return {
          success: false,
          error: 'Erro ao criar categoria',
        };
      }

      return {
        success: true,
        data: category as Category,
      };
    } catch (error) {
      console.error('Create category error:', error);
      return {
        success: false,
        error: 'Erro ao criar categoria',
      };
    }
  },

  /**
   * Atualizar categoria
   */
  updateCategory: async (id: string, updates: UpdateCategoryDTO): Promise<ApiResponse<Category>> => {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !category) {
        console.error('Update category error:', error);
        return {
          success: false,
          error: 'Erro ao atualizar categoria',
        };
      }

      return {
        success: true,
        data: category as Category,
      };
    } catch (error) {
      console.error('Update category error:', error);
      return {
        success: false,
        error: 'Erro ao atualizar categoria',
      };
    }
  },

  /**
   * Deletar categoria (soft delete)
   */
  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Delete category error:', error);
        return {
          success: false,
          error: 'Erro ao deletar categoria',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Delete category error:', error);
      return {
        success: false,
        error: 'Erro ao deletar categoria',
      };
    }
  },

  /**
   * Obter orçamento de uma categoria para o mês atual
   */
  getCurrentBudget: async (categoryId: string): Promise<ApiResponse<CategoryBudget>> => {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const { data: budget, error } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('category_id', categoryId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Get current budget error:', error);
        return {
          success: false,
          error: 'Erro ao buscar orçamento',
        };
      }

      return {
        success: true,
        data: budget as CategoryBudget,
      };
    } catch (error) {
      console.error('Get current budget error:', error);
      return {
        success: false,
        error: 'Erro ao buscar orçamento',
      };
    }
  },
};