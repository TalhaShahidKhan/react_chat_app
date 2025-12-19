import { query } from "../config/db";

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export const createUser = async (
  username: string,
  email: string,
  passwordHash: string
): Promise<User> => {
  const sql = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await query(sql, [username, email, passwordHash]);
  return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const sql = `SELECT * FROM users WHERE email = $1`;
  const result = await query(sql, [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  const sql = `SELECT * FROM users WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};
