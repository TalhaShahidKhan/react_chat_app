import { query } from "../config/db";

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: Date;
}

export const createMessage = async (
  senderId: number,
  receiverId: number,
  content: string
): Promise<Message> => {
  const sql = `
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await query(sql, [senderId, receiverId, content]);
  return result.rows[0];
};

export const getMessages = async (
  userId1: number,
  userId2: number
): Promise<Message[]> => {
  const sql = `
    SELECT * FROM messages
    WHERE (sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at ASC
  `;
  const result = await query(sql, [userId1, userId2]);
  return result.rows;
};
