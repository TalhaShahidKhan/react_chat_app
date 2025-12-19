import { query } from "../config/db";
import { User } from "./userModel";

export const addFriend = async (userId: number, friendId: number) => {
  const sql = `
    INSERT INTO friendships (user_id, friend_id)
    VALUES ($1, $2), ($2, $1)
    ON CONFLICT DO NOTHING
  `;
  await query(sql, [userId, friendId]);
};

export const getFriends = async (userId: number): Promise<User[]> => {
  const sql = `
    SELECT u.id, u.username, u.email
    FROM users u
    JOIN friendships f ON u.id = f.friend_id
    WHERE f.user_id = $1
  `;
  const result = await query(sql, [userId]);
  return result.rows;
};
