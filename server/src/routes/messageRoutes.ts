import { Response, Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { getMessages } from "../models/messageModel";

const router = Router();

// Get message history with a friend
router.get("/:friendId", authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  const friendId = parseInt(req.params.friendId);

  if (isNaN(friendId))
    return res.status(400).json({ message: "Invalid friend ID" });

  try {
    const messages = await getMessages(userId, friendId);
    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
