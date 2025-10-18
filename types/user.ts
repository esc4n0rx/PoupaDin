/**
 * User Types
 */

export interface User {
  id: string;
  full_name: string;
  email: string;
  birth_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  full_name: string;
  email: string;
  password: string;
  birth_date: string;
}